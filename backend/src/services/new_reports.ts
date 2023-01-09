import Big from "big.js";
import dayjs from "dayjs";
import {
	DATE_FORMAT,
	fourDecimalFormat,
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
	SinglePrintableReport,
} from "../models/new_reports.model.js";
import { withVAT, poolExecute } from "../util.js";
import { applyPrices } from "./records.service.js";
import fs from "fs/promises";
import { generatePDF, populateTemplateHtml } from "../pdf.js";
import { ArticleRecords, Record } from "../models/records.model.js";
import { getVendorSimple, getVendorsSimple } from "./vendors.service.js";
import { getKW } from "../time.js";
import { getArticleInfo } from "./articles.service.js";

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
		// Article summary calculations
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

		// Total summary calculations
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

async function prepareAnyReport<T>(
	report: {
		rows: T[];
		summary: ReportSummary;
	},
	rowGen: RowGenerator<T>,
	summaryGen: SummaryGenerator
) {
	return {
		...report,
		rows: report.rows.map(rowGen),
		summary: summaryGen(report.summary),
	};
}

async function prepareArticleReport(
	report: ArticleReport,
	rowGen: RowGenerator<ReportRecord>,
	summaryGen: SummaryGenerator
): Promise<SinglePrintableReport> {
	return {
		identifier: (await getArticleInfo(report.articleId)).name,
		rows: report.records.map(rowGen),
		summary: summaryGen(report.summary),
	};
}

async function prepareMultiArticleReport(
	report: MultiArticleReport,
	rowGen: RowGenerator<ReportRecord>,
	summaryGen: SummaryGenerator
): Promise<PrintableReport> {
	return {
		articles: await Promise.all(
			report.articles.map(async (report) => prepareArticleReport(report, rowGen, summaryGen))
		),
		summary: {
			rows: report.articles.map((report) => summaryGen(report.summary)),
			summary: summaryGen(report.summary),
		},
	};
}

function genReportHead(entity: string, date: Date, invoiceSystem: number) {
	let headline = "Bericht",
		time = dayjs(date).format("DD.MM.YYYY");

	const year = String(date.getFullYear());

	switch (invoiceSystem) {
		case 0:
			headline = "Tagesbericht";
			time = dayjs(date).format("DD.MM.YYYY");
			break;
		case 1:
			headline = "Wochenbericht";
			time = "KW " + getKW(date) + " " + year;
			break;
		case 2:
			headline = "Monatsbericht";
			time = months[date.getMonth()] + " " + year;
			break;
		case 3:
			headline = "Jahresbericht";
			time = year;
			break;
	}

	return {
		headline,
		time,
		entity,
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
	PERCENTAGE: <Style>{
		pdfStyle: (cell: number) => cell + " %",
		excelStyle: { numFmt: '#0 "%"' },
	},
	TWO_DECIMAL: <Style>{
		pdfStyle: (cell: number) => twoDecimalFormat.format(cell),
		excelStyle: { numFmt: '#,##0.00 "€"' },
	},
	FOUR_DECIMAL: <Style>{
		pdfStyle: (cell: number) => fourDecimalFormat.format(cell),
		excelStyle: { numFmt: '#,####0.0000 "€"' },
	},
	TWO_DECIMAL_NO_CURRENCY: <Style>{
		pdfStyle: (cell: number) => twoDecimalFormatNoCurrency.format(cell),
		excelStyle: { numFmt: "#,##0.00" },
	},
	FOUR_DECIMAL_NO_CURRENCY: <Style>{
		pdfStyle: (cell: number) => fourDecimalFormatNoCurrency.format(cell),
		excelStyle: { numFmt: "#,####0.0000" },
	},
} as const;

function styleRow(row: Cell[], styles: Style[]): string[] {
	return row.map((cell, i) => styles[i].pdfStyle(cell));
}

function pdfStyleAnyReport(rows: Cell[][], summary: Cell[], rowStyles: Style[], summaryStyles: Style[]) {
	return {
		rows: rows.map((row) => styleRow(row, rowStyles)),
		summary: styleRow(summary, summaryStyles),
	};
}

function pdfStyleReport(report: PrintableReport, rowStyles: Style[], summaryStyles: Style[]): PrintableReport {
	const articles = report.articles.map((article) => ({
		...article,
		...pdfStyleAnyReport(article.rows, article.summary, rowStyles, summaryStyles);
	}));

	return {
		articles,
		summary: {
			identifier: "Zusammenfassung",
			rows: articles.map((article) => article.summary),
			summary: styleRow(report.summary.summary, summaryStyles),
		},
	};
}

export async function renderArticleReportPDF(report: ArticleReport) {
	const prepared = await prepareMultiArticleReport(
		{
			articles: [report],
			summary: report.summary,
		},
		(record) => [record.date, record.supply, record.remissions, record.sales],
		(summary) => [summary.basic!.supply, summary.basic!.remissions, summary.basic!.sales]
	);

	const styled = pdfStyleReport(
		prepared,
		[STYLES.DATE, STYLES.PLAIN, STYLES.PLAIN, STYLES.PLAIN],
		[STYLES.PLAIN, STYLES.PLAIN, STYLES.PLAIN]
	);

	const head = genReportHead("Entity", new Date(), 2);

	return await renderReport("reports/article.html", { head, ...styled.articles[0] });
}

export async function renderAllArticlesReportPDF(report: MultiArticleReport) {
	const prepared = await prepareMultiArticleReport(
		report,
		({ date, supply, remissions, sales, price }) => {
			const nettoPurchase = price.purchase.mul(sales);

			return [
				date,
				supply,
				remissions,
				sales,
				price.mwst,
				nettoPurchase.toNumber(),
				withVAT(nettoPurchase, price.mwst).toNumber(),
				price.marketSell.toNumber(),
				withVAT(price.marketSell, price.mwst).toNumber(),
			];
		},
		({ basic, purchase, marketSell }) => [
			basic!.supply,
			basic!.remissions,
			basic!.sales,
			"",
			purchase!.netto.toNumber(),
			purchase!.brutto.toNumber(),
			marketSell!.netto.toNumber(),
			marketSell!.brutto.toNumber(),
		]
	);

	const styled = pdfStyleReport(
		prepared,
		[
			STYLES.DATE,
			STYLES.PLAIN,
			STYLES.PLAIN,
			STYLES.PLAIN,
			STYLES.PERCENTAGE,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
		],
		[
			STYLES.PLAIN,
			STYLES.PLAIN,
			STYLES.PLAIN,
			STYLES.PLAIN,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
		]
	);

	const head = genReportHead("Entity", new Date(), 2);

	return await renderReport("reports/all_articles.html", { head, ...styled });
}

export async function renderVendorReportPDF(report: MultiArticleReport) {
	const prepared = await prepareMultiArticleReport(
		report,
		({ date, supply, remissions, sales, price }) => {
			const nettoPurchase = price.purchase.mul(sales);

			return [
				date,
				supply,
				remissions,
				sales,
				price.mwst,
				nettoPurchase.toNumber(),
				withVAT(nettoPurchase, price.mwst).toNumber(),
				price.sell.toNumber(),
				withVAT(price.sell, price.mwst).toNumber(),
			];
		},
		({ basic, purchase, sell }) => [
			basic!.supply,
			basic!.remissions,
			basic!.sales,
			"",
			purchase!.netto.toNumber(),
			purchase!.brutto.toNumber(),
			sell!.netto.toNumber(),
			sell!.brutto.toNumber(),
		]
	);

	const styled = pdfStyleReport(
		prepared,
		[
			STYLES.DATE,
			STYLES.PLAIN,
			STYLES.PLAIN,
			STYLES.PLAIN,
			STYLES.PERCENTAGE,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
		],
		[
			STYLES.PLAIN,
			STYLES.PLAIN,
			STYLES.PLAIN,
			STYLES.PLAIN,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
			STYLES.TWO_DECIMAL,
		]
	);

	const head = genReportHead("Entity", new Date(), 2);

	return await renderReport("reports/vendor.html", { head, ...styled });
}

export async function renderAllVendorsReportPDF(report: AllVendorsReport) {
	const modifiedReport = {
		rows: await Promise.all(
			report.vendors.map(async (vendor) => ({
				name: (await getVendorSimple(vendor.vendorId)).name,
				summary: report.summary,
			}))
		),
		summary: report.summary,
	};

	const prepared = await prepareAnyReport(
		modifiedReport,
		({ name, summary }) => {
			return [name, summary.sell!.netto.toNumber(), summary.sell!.brutto.toNumber()];
		},
		({ sell }) => [sell!.netto.toNumber(), sell!.brutto.toNumber()]
	);

	const styled = pdfStyleAnyReport(
		prepared.rows, prepared.summary,
		[STYLES.PLAIN, STYLES.TWO_DECIMAL, STYLES.TWO_DECIMAL],
		[STYLES.TWO_DECIMAL, STYLES.TWO_DECIMAL]
	);

	const head = genReportHead("Alle Händler", new Date(), 2);

	return await renderReport("reports/vendor.html", { head, ...styled });
}

export async function renderReport(templateFile: string, data: any): Promise<Buffer> {
	const template = (await fs.readFile("./templates/" + templateFile)).toString();

	const html = populateTemplateHtml(template, data);

	const pdf = await generatePDF(html);

	return pdf;
}
