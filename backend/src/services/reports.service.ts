import ExcelJS from "exceljs";
import Big from "big.js";
import { getVendorCatalog, getVendorSimple, getVendorsSimple } from "./vendors.service.js";
import { applyPrices, getArticleRecords, getDateRange } from "./records.service.js";
import { Column, Report, ReportDoc, ReportedVendor, WeeklyBillReport } from "../models/reports.model.js";
import { mulWithMwst, poolExecute } from "../util.js";
import dayjs from "dayjs";
import { DATE_FORMAT, dinA4ExcelLandscape, MILlIS_IN_DAY, months, twoDecimalFormat } from "../consts.js";
import { daysBetween, getKW } from "../time.js";
import { DefiniteRecord, Record } from "../models/records.model.js";
import { getArticleInfo, getArticleInfos } from "./articles.service.js";
import fs from "fs/promises";
import { applyStyler, generatePDF, populateTemplateHtml } from "../pdf.js";
import { Response } from "express";

function calculateTotalValues(byMwst: Map<number, Big>): [Big, Big] {
	const totalNetto = [...byMwst.values()].reduce((a, b) => a.add(b), Big(0));
	const totalBrutto = [...byMwst.entries()]
		.map(([mwst, value]) => value.mul(1 + mwst / 100))
		.reduce((a, b) => a.add(b), Big(0));

	return [totalNetto, totalBrutto];
}

export async function getArticleSalesReport(articleId: number, date: Date, invoiceSystem: number) {
	const [start, end] = getDateRange(date, invoiceSystem);

	const records = (
		await poolExecute<{ date: Date; supply: string; remissions: string; sales: number }>(
			`SELECT date, SUM(supply) as supply, SUM(remissions) as remissions, SUM(supply - remissions) AS sales
		 FROM records WHERE article_id=? AND date BETWEEN ? AND ?
		 GROUP BY date
		 ORDER BY date
		 `,
			[articleId, dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
		)
	).map((record) => ({ ...record, supply: parseInt(record.supply), remissions: parseInt(record.remissions) }));

	const newRecords: { supply: number; remissions: number; sales: number }[] = [];

	let prev = dayjs(start).subtract(1, "day").toDate();
	for (const { date, supply, remissions, sales } of records) {
		const missingDays = daysBetween(prev, date) - 1;

		for (let i = 0; i < missingDays; i++) {
			newRecords.push({
				supply: 0,
				remissions: 0,
				sales: 0,
			});
		}

		newRecords.push({ supply, remissions, sales });

		prev = date;
	}

	const totalDays = daysBetween(start, end);
	for (let day = newRecords.length; day <= totalDays; day++) {
		newRecords.push({ supply: 0, remissions: 0, sales: 0 });
	}

	const [totalSupply, totalRemissions] = records
		.map((r) => [r.supply, r.remissions])
		.reduce(([pSupply, pRem], [cSupply, cRem]) => [pSupply + cSupply, pRem + cRem], [0, 0]);

	return {
		records: newRecords,
		totalSupply,
		totalRemissions,
		totalSales: totalSupply - totalRemissions,
	};
}

export async function createArticleSalesReport(articleId: number, date: Date, invoiceSystem: number): Promise<Report> {
	const data = await getArticleSalesReport(articleId, date, invoiceSystem);

	const [start] = getDateRange(date, invoiceSystem);
	const startDate = dayjs(start);

	return {
		invoiceSystem,
		itemSpecifier: (await getArticleInfo(articleId)).name,
		columns: [
			{
				header: "Datum",
				width: 20,
				styler: (value) => dayjs(value).format("DD.MM.YYYY"),
			},
			{
				header: "Lieferung",
				width: 10,
				// styler: (v) => v + " Stk.",
			},
			{
				header: "Remissionen",
				width: 15,
				// styler: (v) => v + " Stk.",
			},
			{
				header: "Verkauf",
				width: 10,
				// styler: (v) => v + " Stk.",
			},
		],
		date,
		body: [
			{
				rows:
					invoiceSystem === 3
						? []
						: data.records.map((r, i) => [
								startDate.add(i, "days").toDate(),
								r.supply,
								r.remissions,
								r.sales,
						  ]),
				summary: [data.totalSupply, data.totalRemissions, data.totalSales],
			},
		],
		summary: [data.totalSupply, data.totalRemissions, data.totalSales],
	};
}

interface ArticleListingReport {
	owner: string;
	items: ReportItem[];
	totalSellNetto: Big;
	totalSellBrutto: Big;
}

interface ReportItem {
	mwst: number;
	name: string;
	rows: DefiniteRecord[];
}

function generateTotalSellOfItems(items: ReportItem[]) {
	let [totalSellNetto, totalSellBrutto] = [Big(0), Big(0)];

	for (const item of items) {
		const netto = item.rows
			.map((record) => Big(record.sales).mul(record.price.sell))
			.reduce((a, b) => a.add(b), Big(0));

		totalSellNetto = totalSellNetto.add(netto);
		totalSellBrutto = totalSellBrutto.add(mulWithMwst(netto, item.mwst));
	}

	return { totalSellNetto, totalSellBrutto };
}

export async function getVendorSalesReport(
	vendorId: number,
	date: Date,
	invoiceSystem: number
): Promise<ArticleListingReport> {
	const catalog = await getVendorCatalog(vendorId);
	const articles = catalog.entries.filter((entry) => entry.included);
	const [start, end] = getDateRange(date, invoiceSystem);

	const items: ReportItem[] = [];

	for (const { articleId, articleName } of articles) {
		const recordsByMwst = new Map<number, ReportItem>();

		const records = (await getArticleRecords(vendorId, articleId, start, end)).records.map((r) => {
			return {
				date: r.date,
				price: r.price!,
				supply: r.missing ? 0 : r.supply,
				remissions: r.missing ? 0 : r.remissions,
				sales: r.missing ? 0 : r.supply - r.remissions,
			};
		});

		for (const record of records) {
			let item = recordsByMwst.get(record.price.mwst);
			if (item === undefined) {
				item = {
					mwst: record.price.mwst,
					name: articleName,
					rows: [],
				};

				recordsByMwst.set(record.price.mwst, item);
				items.push(item);
			}

			item.rows.push(record);
		}
	}

	const vendor = await getVendorSimple(vendorId);

	return {
		owner: `${vendor.name} (Kundennr.: ${vendor.customId})`,
		items,
		...generateTotalSellOfItems(items),
	};
}

export async function createArticleListingReport(
	{ items, owner }: ArticleListingReport,
	date: Date,
	invoiceSystem: number
): Promise<Report> {
	let [totalSupply, totalRemissions] = [0, 0];
	let [totalSellNetto, totalSellBrutto, totalMarketNetto, totalMarketBrutto] = [Big(0), Big(0), Big(0), Big(0)];

	const sharedColumns = [
		{
			header: "Lieferung",
			width: 10,
		},
		{
			header: "Remission",
			width: 10,
		},
		{
			header: "Verkauf",
			width: 10,
		},
		{
			header: "Betrag (Netto)",
			width: 15,
			style: { numFmt: '#,##0.00 "€"' },
			styler: twoDecimalFormat.format,
		},
		{
			header: "Betrag (Brutto)",
			width: 15,
			style: { numFmt: '#,##0.00 "€"' },
			styler: twoDecimalFormat.format,
		},
		{
			header: "Warenwert (Netto)",
			width: 20,
			style: { numFmt: '#,##0.00 "€"' },
			styler: twoDecimalFormat.format,
		},
		{
			header: "Warenwert (Brutto)",
			width: 20,
			style: { numFmt: '#,##0.00 "€"' },
			styler: twoDecimalFormat.format,
		},
	];

	return {
		invoiceSystem,
		itemSpecifier: owner,
		columns: [
			{
				header: "Datum",
				width: 30,
				styler: (value) => dayjs(value).format("DD.MM.YYYY"),
			},
			...sharedColumns,
		],
		summaryColumns: [
			{ header: "Artikel", width: 30 },
			...sharedColumns.slice(0, sharedColumns.length - 2),
			{ header: "Umsatz (Netto)", styler: twoDecimalFormat.format },
			{ header: "Umsatz (Brutto)", styler: twoDecimalFormat.format },
		],
		body: items.map((item) => {
			let [supply, remissions] = [0, 0];
			let [sellNetto, marketNetto] = [Big(0), Big(0)];

			const rows = item.rows.map((record) => {
				const sellValue = record.sales > 0 ? Big(record.sales).mul(record.price!.sell) : Big(0);
				const marketValue = record.sales > 0 ? Big(record.sales).mul(record.price!.marketSell) : Big(0);

				supply += record.supply;
				remissions += record.remissions;

				sellNetto = sellNetto.add(sellValue);
				marketNetto = marketNetto.add(marketValue);

				return [
					record.date,
					record.supply,
					record.remissions,
					record.sales,
					sellValue.toNumber(),
					sellValue.eq(0) ? 0 : mulWithMwst(marketValue, item.mwst).toNumber(),
					record.price.marketSell,
					mulWithMwst(Big(record.price.marketSell), item.mwst).toNumber(),
				];
			});

			const [sellBrutto, marketBrutto] = [mulWithMwst(sellNetto, item.mwst), mulWithMwst(marketNetto, item.mwst)];

			totalSupply += supply;
			totalRemissions += remissions;

			totalSellNetto = totalSellNetto.add(sellNetto);
			totalSellBrutto = totalSellBrutto.add(sellBrutto);
			totalMarketNetto = totalMarketNetto.add(marketNetto);
			totalMarketBrutto = totalMarketBrutto.add(marketBrutto);

			return {
				name: `${item.name} (${item.mwst}%)`,
				rows: invoiceSystem === 3 ? [] : rows,
				summary: [
					supply,
					remissions,
					supply - remissions,
					sellNetto.toNumber(),
					sellBrutto.toNumber(),
					marketNetto.toNumber(),
					marketBrutto.toNumber(),
				],
			};
		}),
		date,
		summary: [
			totalSupply,
			totalRemissions,
			totalSupply - totalRemissions,
			totalSellNetto.toNumber(),
			totalSellBrutto.toNumber(),
			totalMarketNetto.toNumber(),
			totalMarketBrutto.toNumber(),
		],
	};
}

export async function getAllSalesReport(date: Date, invoiceSystem: number): Promise<ArticleListingReport> {
	const [start, end] = getDateRange(date, invoiceSystem);
	const numDays = daysBetween(start, end) + 1;
	const articles = await getArticleInfos();

	const items: ReportItem[] = [];

	for (const { id, name } of articles) {
		const recordsByMwst = new Map<number, ReportItem>();

		const existingRecords = (
			await poolExecute<Record>(
				`SELECT date, article_id as articleId, SUM(supply) AS supply, SUM(remissions) AS remissions FROM records
			 WHERE article_id=? AND date BETWEEN ? AND ?
			 GROUP BY date`,
				[id, dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
			)
		)
			// SUM(...) returns a DECIMAL, which is why we have to cast to int
			.map((r) => {
				const supply = parseInt(String(r.supply));
				const remissions = parseInt(String(r.remissions));

				return {
					...r,
					supply,
					remissions,
					sales: supply - remissions,
				};
			});

		const records: Record[] = Array(numDays)
			.fill(null)
			.map((_, i) => ({
				date: dayjs(start).add(i, "days").toDate(),
				supply: 0,
				remissions: 0,
				sales: 0,
			}));

		for (const record of existingRecords) {
			records[Math.round((record.date.getTime() - start.getTime()) / MILlIS_IN_DAY)] = record;
		}

		await applyPrices(start, end, [{ id, records }]);

		// @ts-ignore
		const definiteRecords: DefiniteRecord[] = records;

		for (const record of definiteRecords) {
			let item = recordsByMwst.get(record.price.mwst);
			if (item === undefined) {
				item = {
					mwst: record.price.mwst,
					name,
					rows: [],
				};

				recordsByMwst.set(record.price.mwst, item);
				items.push(item);
			}

			item.rows.push(record);
		}
	}

	return {
		items,
		owner: "Gesamt",
		...generateTotalSellOfItems(items),
	};
}

export async function getWeeklyBillReport(date: Date): Promise<WeeklyBillReport> {
	const vendors = await getVendorsSimple();

	let totalNetto = Big(0),
		totalBrutto = Big(0);
	const reports: ReportedVendor[] = [];
	for (const { id, name } of vendors) {
		const report = await getVendorSalesReport(id, date, 1);
		reports.push({
			name,
			amountNetto: report.totalSellNetto,
			amountBrutto: report.totalSellBrutto,
		});

		totalNetto = totalNetto.add(report.totalSellNetto);
		totalBrutto = totalBrutto.add(report.totalSellBrutto);
	}

	return {
		vendors: reports,
		totalNetto,
		totalBrutto,
	};
}

export async function createWeeklyBillReport(report: WeeklyBillReport, date: Date): Promise<Report> {
	return {
		date,
		invoiceSystem: 1,
		itemSpecifier: "Alle Händler",
		body: [
			{
				rows: report.vendors.map((vendor) => [
					vendor.name,
					vendor.amountNetto.toNumber(),
					vendor.amountBrutto.toNumber(),
				]),
				summary: [report.totalNetto, report.totalBrutto],
			},
		],
		columns: [
			{
				header: "Händler",
				width: 15,
			},
			{
				header: "Betrag (Netto)",
				width: 20,
				style: { numFmt: '#,##0.00 "€"' },
				styler: twoDecimalFormat.format,
			},
			{
				header: "Betrag (Brutto)",
				width: 20,
				style: { numFmt: '#,##0.00 "€"' },
				styler: twoDecimalFormat.format,
			},
		],
		summary: [report.totalNetto.toNumber(), report.totalBrutto.toNumber()],
	};
}

export async function createReportDoc(report: Report): Promise<ReportDoc> {
	let top = "Bericht",
		sub = dayjs(report.date).format("DD.MM.YYYY"),
		itemSpecifier = report.itemSpecifier || "",
		tablesPerPage = 1;

	switch (report.invoiceSystem) {
		case 0:
			top = "Tagesbericht";
			sub = dayjs(report.date).format("DD.MM.YYYY");
			tablesPerPage = 6;
			break;
		case 1:
			top = "Wochenbericht";
			sub = "KW " + getKW(report.date);
			tablesPerPage = 3;
			break;
		case 2:
			top = "Monatsbericht";
			sub = months[report.date.getMonth()];
			break;
		case 3:
			top = "Jahresbericht";
			sub = "" + report.date.getFullYear();
			break;
	}

	return {
		header: {
			top,
			sub,
			itemSpecifier,
		},
		columns: report.columns,
		summaryColumns: report.summaryColumns,
		body: report.body,
		tablesPerPage,
		summary: report.summary,
	};
}

export async function createExcelReport(doc: ReportDoc): Promise<ExcelJS.Workbook> {
	const workbook = new ExcelJS.Workbook();
	const mainSheet = workbook.addWorksheet("Bericht", dinA4ExcelLandscape);

	const hasMainSummary = doc.summaryColumns !== undefined;

	if (hasMainSummary) mainSheet.columns = doc.summaryColumns!;

	mainSheet.insertRow(1, []);

	[doc.header.top, doc.header.sub, doc.header.itemSpecifier].forEach((text, i) => {
		mainSheet.insertRow(i + 1, [text]);
		mainSheet.getCell(i + 1, 1).style = {
			font: {
				bold: true,
			},
		};
	});

	const boldRow = (row: number, sheet: ExcelJS.Worksheet) => {
		for (let column = 1; column <= doc.columns.length; column++) {
			const cell = sheet.getCell(row, column);
			cell.style = {
				...cell.style,
				font: {
					...cell.style.font,
					bold: true,
				},
			};
		}
	};

	mainSheet.mergeCells("A3:C3");

	const mainSummaryHeaderRow = 5;

	doc.body?.forEach((item, i) => {
		const itemSheet = workbook.addWorksheet(item.name, dinA4ExcelLandscape);
		itemSheet.columns = doc.columns;

		item.rows.forEach((row, i) => {
			itemSheet.insertRow(2 + i, row);
		});

		const summaryRow = 2 + item.rows.length;
		itemSheet.insertRow(summaryRow, ["Zusammenfassung", ...item.summary]);

		if (hasMainSummary) mainSheet.insertRow(mainSummaryHeaderRow + i + 1, [item.name, ...item.summary]);

		for (const rowNum of [1, summaryRow]) {
			boldRow(rowNum, itemSheet);
		}
	});

	const summaryRow = mainSummaryHeaderRow + (doc.body?.length || 0) + 1;
	const summary = ["Zusammenfassung", ...doc.summary];

	if (hasMainSummary) mainSheet.insertRow(summaryRow, summary);

	boldRow(mainSummaryHeaderRow, mainSheet);
	boldRow(summaryRow, mainSheet);

	return workbook;
}

export async function createPDFReport(doc: ReportDoc): Promise<Buffer> {
	const template = (await fs.readFile("./templates/report.html")).toString();

	const html = populateTemplateHtml(template, {
		title: "Bericht",
		tablesPerPage: doc.tablesPerPage,
		header: doc.header,
		summaryColumns: doc.summaryColumns,
		items:
			doc.body?.map((item) => {
				return {
					columns: doc.columns,
					...item,
					rows: item.rows.map((row) => applyStyler(row, doc.columns)),
					summary: applyStyler(item.summary, doc.columns),
				};
			}) || [],
		summary: doc.summaryColumns !== undefined && applyStyler(doc.summary, doc.summaryColumns),
	});

	return await generatePDF(html);
}
