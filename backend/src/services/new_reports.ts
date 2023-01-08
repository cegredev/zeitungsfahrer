import Big from "big.js";
import dayjs from "dayjs";
import {
	DATE_FORMAT,
	fourDecimalFormatNoCurrency,
	months,
	twoDecimalFormat,
	twoDecimalFormatNoCurrency,
} from "../consts.js";
import {
	Amount,
	ArticleReport,
	DBRecord,
	Report,
	ReportRecord,
	ReportSummary,
	MultiArticleReport,
	VendorReport,
	AllVendorsReport,
	RowGenerator,
	Cell,
	SummaryGenerator,
	PrintableReport,
	Style,
	PrintableReportDoc,
} from "../models/new_reports.model.js";
import { withVAT, poolExecute } from "../util.js";
import { applyPrices } from "./records.service.js";
import fs from "fs/promises";
import { generatePDF, populateTemplateHtml } from "../pdf.js";
import { ArticleRecords, Record } from "../models/records.model.js";
import { getVendorsSimple } from "./vendors.service.js";
import { getKW } from "../time.js";

export const MAX_DIGITS = 2;

function createEmptySummary(): ReportSummary {
	return {
		basic: {
			supply: 0,
			remissions: 0,
			sales: 0,
		},
		purchase: {
			netto: Big(0),
			brutto: Big(0),
		},
		sell: {
			netto: Big(0),
			brutto: Big(0),
		},
		marketSell: {
			netto: Big(0),
			brutto: Big(0),
		},
	};
}

function categorizeRecordsById<T>(records: T[], getId: (record: T) => number): Map<number, T[]> {
	const map = new Map<number, T[]>();

	for (const record of records) {
		const id = getId(record);

		let records = map.get(id);
		if (records === undefined) {
			map.set(id, (records = []));
		}

		records.push(record);
	}

	return map;
}

export async function getAnyReport(
	start: Date,
	end: Date,
	fetchRecords: () => Promise<Map<number, DBRecord[]>>
): Promise<Report> {
	const initialRecords = await fetchRecords();

	await applyPrices(
		start,
		end,
		[...initialRecords.entries()].map(([id, records]) => ({ id, records }))
	);

	// @ts-ignore
	const recordsMap: Map<number, ReportRecord[]> = initialRecords;

	const reports: Map<number, ArticleReport> = new Map(
		[...recordsMap.entries()].map(([id, records]) => [
			id,
			{
				articleId: id,
				records,
				summary: createEmptySummary(),
			},
		])
	);

	const totalSummary = createEmptySummary();

	for (const { records, summary } of reports.values()) {
		for (const { supply, remissions, sales, price } of records) {
			summary.basic!.supply += supply;
			summary.basic!.remissions += remissions;
			summary.basic!.sales += sales;

			for (const [priceValue, amount] of <[Big, Amount][]>[
				[price.purchase, summary.purchase!],
				[price.sell, summary.sell!],
				[price.marketSell, summary.marketSell!],
			]) {
				const netto = priceValue.mul(sales);

				amount.netto = amount.netto.add(netto.round(MAX_DIGITS));
				amount.brutto = amount.brutto.add(withVAT(netto, price.mwst));
			}
		}

		totalSummary.basic!.supply += summary.basic!.supply;
		totalSummary.basic!.remissions += summary.basic!.remissions;
		totalSummary.basic!.sales += summary.basic!.sales;

		for (const [total, article] of <[Amount, Amount][]>[
			[totalSummary.purchase!, summary.purchase!],
			[totalSummary.sell!, summary.sell!],
			[totalSummary.marketSell!, summary.marketSell!],
		]) {
			total.netto = total.netto.add(article.netto);
			total.brutto = total.brutto.add(article.brutto);
		}
	}

	return {
		reports,
		summary: totalSummary,
	};
}

export async function getArticleReport(articleId: number, start: Date, end: Date): Promise<ArticleReport> {
	const data = await getAnyReport(start, end, async () => {
		const records = (
			await poolExecute<{ date: Date; supply: string; remissions: string; sales: string }>(
				`SELECT date, SUM(supply) as supply, SUM(remissions) as remissions, SUM(supply - remissions) AS sales
		 FROM records WHERE article_id=? AND date BETWEEN ? AND ? 
		 GROUP BY date ORDER BY date
		 `,
				[articleId, dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
			)
		).map((record) => ({
			...record,
			supply: parseInt(record.supply),
			remissions: parseInt(record.remissions),
			sales: parseInt(record.sales),
		}));

		return new Map<number, DBRecord[]>([[articleId, records]]);
	});

	return data.reports.get(articleId)!;
}

export async function getAllArticlesReport(start: Date, end: Date): Promise<MultiArticleReport> {
	const data = await getAnyReport(start, end, async () => {
		const records = (
			await poolExecute<{ articleId: number; date: Date; supply: string; remissions: string; sales: string }>(
				`SELECT article_id as articleId, date, SUM(supply) as supply, SUM(remissions) as remissions, SUM(supply - remissions) AS sales
		 FROM records WHERE date BETWEEN ? AND ? 
		 GROUP BY article_id, date ORDER BY date
		 `,
				[dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
			)
		).map((record) => ({
			...record,
			supply: parseInt(record.supply),
			remissions: parseInt(record.remissions),
			sales: parseInt(record.sales),
		}));

		return categorizeRecordsById(records, (r) => r.articleId);
	});

	return {
		articles: [...data.reports.values()],
		summary: data.summary,
	};
}

export async function getVendorReport(vendorId: number, start: Date, end: Date): Promise<VendorReport> {
	const data = await getAnyReport(start, end, async () => {
		const records = await poolExecute<{
			articleId: number;
			date: Date;
			supply: number;
			remissions: number;
			sales: number;
		}>(
			`SELECT article_id as articleId, date, supply, remissions, (supply - remissions) AS sales
		 FROM records WHERE vendor_id=? AND date BETWEEN ? AND ? 
		 ORDER BY date
		 `,
			[vendorId, dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
		);

		return categorizeRecordsById(records, (r) => r.articleId);
	});

	return {
		vendorId,
		articles: [...data.reports.values()],
		summary: data.summary,
	};
}

export async function getAllVendorsReport(start: Date, end: Date): Promise<AllVendorsReport> {
	const vendors = (await getVendorsSimple()).filter((vendor) => vendor.active);

	const reports = await Promise.all(vendors.map((vendor) => getVendorReport(vendor.id, start, end)));

	const [sellNetto, sellBrutto] = reports
		.map((report) => [report.summary.sell!.netto, report.summary.sell!.brutto])
		.reduce(
			([nettoOld, bruttoOld], [netto, brutto]) => [nettoOld.add(netto), bruttoOld.add(brutto)],
			[Big(0), Big(0)]
		);

	return {
		vendors: reports,
		summary: {
			sell: {
				netto: sellNetto,
				brutto: sellBrutto,
			},
		},
	};
}

function prepareArticleReport(
	report: MultiArticleReport,
	rowGen: RowGenerator,
	summaryGen: SummaryGenerator
): PrintableReport {
	return {
		articles: report.articles.map((report) => ({
			rows: report.records.map(rowGen),
			summary: summaryGen(report.summary),
		})),
		summary: {
			rows: report.articles.map((report) => summaryGen(report.summary)),
			summary: summaryGen(report.summary),
		},
	};
}

function addReportHead(report: PrintableReport, entity: string, date: Date, invoiceSystem: number): PrintableReportDoc {
	let headline = "Bericht",
		time = dayjs(date).format("DD.MM.YYYY");

	switch (invoiceSystem) {
		case 0:
			headline = "Tagesbericht";
			time = dayjs(date).format("DD.MM.YYYY");
			break;
		case 1:
			headline = "Wochenbericht";
			time = "KW " + getKW(date);
			break;
		case 2:
			headline = "Monatsbericht";
			time = months[date.getMonth()];
			break;
		case 3:
			headline = "Jahresbericht";
			time = String(date.getFullYear());
			break;
	}

	return {
		head: {
			headline,
			time,
			entity,
		},
		...report,
	};
}

const STYLES = {
	PLAIN: <Style>{
		pdfStyle: (cell) => cell,
		excelStyle: { numFmt: "" },
	},
	DATE: <Style>{
		pdfStyle: (cell) => dayjs(cell).format("DD.MM.YYYY"),
		excelStyle: { numFmt: "" },
	},
	TWO_DECIMAL: <Style>{
		pdfStyle: (cell: number) => twoDecimalFormatNoCurrency.format(cell),
		excelStyle: { numFmt: "#,##0.00" },
	},
	FOUR_DECIMAL: <Style>{
		pdfStyle: (cell: number) => fourDecimalFormatNoCurrency.format(cell),
		excelStyle: { numFmt: "#,####0.0000" },
	},
	TWO_DECIMAL_NO_CURRENCY: <Style>{
		pdfStyle: (cell: number) => twoDecimalFormatNoCurrency.format(cell),
		excelStyle: { numFmt: '#,##0.00 "€"' },
	},
	FOUR_DECIMAL_NO_CURRENCY: <Style>{
		pdfStyle: (cell: number) => fourDecimalFormatNoCurrency.format(cell),
		excelStyle: { numFmt: '#,####0.0000 "€"' },
	},
} as const;

function renderArticleReportPDF(report: MultiArticleReport) {
	const prepared = prepareArticleReport();
}

export async function renderAnyReport(templateFile: string, data: any) {
	const template = (await fs.readFile("./templates/" + templateFile)).toString();

	const html = populateTemplateHtml(template, data);

	const pdf = await generatePDF(html);

	return pdf;
}
