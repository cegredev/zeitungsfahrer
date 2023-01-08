import ExcelJS from "exceljs";
import Big from "big.js";
import { getVendorCatalog, getVendorSimple, getVendorsSimple } from "./vendors.service.js";
import { applyPrices, getArticleRecords, getDateRange } from "./records.service.js";
import {
	ArticleListingReport,
	Column,
	Page,
	Report,
	ReportDoc,
	ReportedVendor,
	ReportItem,
	ReportItemDoc,
	VendorSalesReport,
	WeeklyBillReport,
} from "../models/reports.model.js";
import { withVAT, poolExecute } from "../util.js";
import dayjs from "dayjs";
import { DATE_FORMAT, dinA4ExcelLandscape, MILlIS_IN_DAY, months, twoDecimalFormat } from "../consts.js";
import { daysBetween, getKW } from "../time.js";
import { DefiniteRecord, Record } from "../models/records.model.js";
import { getArticleInfo, getArticleInfos } from "./articles.service.js";
import fs from "fs/promises";
import { applyStyler, generatePDF, populateTemplateHtml } from "../pdf.js";
import { boldRow } from "../excel.js";
import { createDocument, storeDocument } from "./documents.service.js";
import { Amount } from "../models/new_reports.model.js";

export async function getArticleSalesReport(articleId: number, date: Date, invoiceSystem: number) {
	const [start, end] = getDateRange(date, invoiceSystem);

	const records = (
		await poolExecute<{ date: Date; supply: string; remissions: string; sales: string }>(
			`SELECT date, SUM(supply) as supply, SUM(remissions) as remissions, SUM(supply - remissions) AS sales
		 FROM records WHERE article_id=? AND date BETWEEN ? AND ?
		 GROUP BY date
		 ORDER BY date
		 `,
			[articleId, dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
		)
	).map((record) => ({
		...record,
		supply: parseInt(record.supply),
		remissions: parseInt(record.remissions),
		sales: parseInt(record.sales),
	}));

	const [totalSupply, totalRemissions] = records
		.filter((r) => r.supply > 0)
		.map((r) => [r.supply, r.remissions])
		.reduce(([pSupply, pRem], [cSupply, cRem]) => [pSupply + cSupply, pRem + cRem], [0, 0]);

	return {
		records,
		totalSupply,
		totalRemissions,
		totalSales: totalSupply - totalRemissions,
	};
}

export async function createArticleSalesReport(articleId: number, date: Date, invoiceSystem: number): Promise<Report> {
	const data = await getArticleSalesReport(articleId, date, invoiceSystem);

	const sharedColumns = [
		{
			header: "Lieferung",
			width: 10,
		},
		{
			header: "Remissionen",
			width: 15,
		},
		{
			header: "Verkauf",
			width: 10,
		},
	];

	return {
		invoiceSystem,
		itemSpecifier: (await getArticleInfo(articleId)).name,
		columns: [
			{
				header: "Datum",
				width: 20,
				styler: (value) => dayjs(value).format("DD.MM.YYYY"),
			},
			...sharedColumns,
		],
		summaryRowColumns: sharedColumns,
		date,
		body: [
			{
				rows: invoiceSystem === 3 ? [] : data.records.map((r) => [r.date, r.supply, r.remissions, r.sales]),
				summary: [data.totalSupply, data.totalRemissions, data.totalSales],
			},
		],
		summary: [data.totalSupply, data.totalRemissions, data.totalSales],
	};
}

function generateTotalSellOfItems(items: ReportItem[]) {
	let [totalSellNetto, totalSellBrutto] = [Big(0), Big(0)];

	for (const item of items) {
		for (const record of item.rows) {
			const netto = record.price.sell.mul(record.sales).round(2);

			totalSellNetto = totalSellNetto.add(netto);
			totalSellBrutto = totalSellBrutto.add(withVAT(netto, record.price.mwst).round(2));
		}
	}

	return { totalSellNetto, totalSellBrutto };
}

export async function getVendorSalesReport(
	vendorId: number,
	date: Date,
	invoiceSystem: number
): Promise<VendorSalesReport> {
	const catalog = await getVendorCatalog(vendorId);
	const articles = catalog.entries.filter((entry) => entry.included);
	const [start, end] = getDateRange(date, invoiceSystem);

	const items: ReportItem[] = [];
	const amountByMwst: Map<number, Amount> = new Map();

	for (const { articleId, articleName } of articles) {
		const item: ReportItem = {
			name: articleName,
			rows: [],
		};
		items.push(item);

		const records = (await getArticleRecords(vendorId, articleId, start, end)).records
			.filter((r) => !r.missing && r.supply > r.remissions)
			.map((r) => {
				return {
					articleId: r.articleId,
					date: r.date,
					supply: r.supply,
					remissions: r.remissions,
					sales: r.supply - r.remissions,
					price: r.price!,
				};
			});

		for (const record of records) {
			let nettoPrice = amountByMwst.get(record.price.mwst);
			if (nettoPrice === undefined) {
				nettoPrice = { netto: Big(0), brutto: Big(0) };

				amountByMwst.set(record.price.mwst, nettoPrice);
			}

			item.rows.push(record);

			const value = record.price.sell.mul(record.sales);
			amountByMwst.set(record.price.mwst, {
				netto: nettoPrice.netto.add(value.round(2)),
				brutto: nettoPrice.brutto.add(withVAT(value, record.price.mwst).round(2)),
			});
		}
	}

	console.log(JSON.stringify([...amountByMwst.entries()]));

	const vendor = await getVendorSimple(vendorId);

	return {
		id: vendor.id,
		owner: `${vendor.name} (Kundennr.: ${vendor.customId})`,
		items,
		nettoByMwst: amountByMwst,
		...generateTotalSellOfItems(items),
	};
}

export async function createArticleListingReport(
	{ items, owner, id }: ArticleListingReport,
	date: Date,
	invoiceSystem: number
): Promise<Report> {
	let [totalSupply, totalRemissions] = [0, 0];
	let [totalSellNetto, totalSellBrutto, totalMarketNetto, totalMarketBrutto] = [Big(0), Big(0), Big(0), Big(0)];

	const sharedColumnsA = [
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
	];
	const sharedColumnsB = [
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
		id,
		invoiceSystem,
		itemSpecifier: owner,
		columns: [
			{
				header: "Datum",
				width: 30,
				styler: (value) => dayjs(value).format("DD.MM.YYYY"),
			},
			...sharedColumnsA,
			{ header: "MwSt", width: 5, style: { numFmt: '#0 "%"' }, styler: (num: any) => (num ? num + " %" : "") },
			...sharedColumnsB,
		],
		summaryRowColumns: [
			{ header: "Artikel", width: 30 },
			...sharedColumnsA,
			{ header: "MwSt", width: 5, style: { numFmt: '#0 "%"' }, styler: (num: any) => (num ? num + " %" : "") },
			...sharedColumnsB.slice(0, sharedColumnsB.length - 2),
			{ header: "Umsatz (Netto)", styler: twoDecimalFormat.format },
			{ header: "Umsatz (Brutto)", styler: twoDecimalFormat.format },
		],
		summaryColumns: [
			{ header: "Artikel", width: 30 },
			...sharedColumnsA,
			{ header: "", width: 0, style: { numFmt: "" }, styler: (num: any) => "" },
			...sharedColumnsB.slice(0, sharedColumnsB.length - 2),
			{ header: "Umsatz (Netto)", styler: twoDecimalFormat.format },
			{ header: "Umsatz (Brutto)", styler: twoDecimalFormat.format },
		],
		body: items.map((item) => {
			let [supply, remissions] = [0, 0];
			let [sellNetto, marketNetto] = [Big(0), Big(0)];
			let [sellBrutto, marketBrutto] = [Big(0), Big(0)];

			const rows = item.rows.map((record) => {
				const sellValue = record.sales > 0 ? Big(record.sales).mul(record.price!.sell).round(2) : Big(0);
				const marketValue =
					record.sales > 0 ? Big(record.sales).mul(record.price!.marketSell).round(2) : Big(0);
				const sellValueBrutto = withVAT(sellValue, record.price.mwst).round(2);
				const marketValueBrutto = withVAT(marketValue, record.price.mwst).round(2);

				supply += record.supply;
				remissions += record.remissions;

				sellNetto = sellNetto.add(sellValue);
				marketNetto = marketNetto.add(marketValue);
				sellBrutto = sellBrutto.add(sellValueBrutto);
				marketBrutto = marketBrutto.add(marketValueBrutto);

				return [
					record.date,
					record.supply,
					record.remissions,
					record.sales,
					record.price.mwst,
					sellValue.toNumber(),
					sellValue.eq(0) ? 0 : withVAT(sellValue, record.price.mwst).round(2).toNumber(),
					record.price.marketSell,
					withVAT(Big(record.price.marketSell), record.price.mwst).round(2).toNumber(),
				];
			});

			totalSupply += supply;
			totalRemissions += remissions;

			totalSellNetto = totalSellNetto.add(sellNetto);
			totalSellBrutto = totalSellBrutto.add(sellBrutto);
			totalMarketNetto = totalMarketNetto.add(marketNetto);
			totalMarketBrutto = totalMarketBrutto.add(marketBrutto);

			return {
				name: item.name,
				rows: invoiceSystem === 3 ? [] : rows,
				summary: [
					supply,
					remissions,
					supply - remissions,
					"",
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
			"",
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
		const item: ReportItem = {
			name,
			rows: [],
		};
		items.push(item);

		const existingRecords = (
			await poolExecute<Record>(
				`SELECT date, SUM(supply) AS supply, SUM(remissions) AS remissions FROM records
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
					articleId: id,
					supply,
					remissions,
					sales: supply - remissions,
				};
			})
			.filter((r) => r.supply > 0);

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
			if (record.supply === 0) continue;

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
	const vendors = (await getVendorsSimple()).filter((vendor) => vendor.active);

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

export function itemsToPages(items: ReportItemDoc[], invoice: boolean): Page[] {
	if (items.length === 0) return [];

	const maxRowsPerPage = 40;

	const maxRowsFirstPage = maxRowsPerPage - (invoice ? 10 : 2);
	const maxRowsLastPage = maxRowsPerPage - (invoice ? items.length * 4 : items.length + 1);

	const pages: Page[] = [];

	let currentRows = maxRowsPerPage + 1; // Make sure to instantly generate a new page
	for (const item of items) {
		const itemRowCount = item.rows.length + 1;
		let newRowCount = currentRows + itemRowCount;

		let maxRows = pages.length > 1 ? maxRowsPerPage : maxRowsFirstPage;

		if (newRowCount > maxRows) {
			pages.push({ items: [], number: pages.length + 1, isLast: false, rowCount: 0 });
			newRowCount = itemRowCount;

			if (itemRowCount > maxRows) {
				console.error(`Warning: Item ${item.name} has more rows(${itemRowCount}) than allowed(${maxRows})!`);
			}
		}

		const page = pages[pages.length - 1];
		page.items.push(item);
		page.rowCount = currentRows = newRowCount;
	}

	const lastPage = pages[pages.length - 1];
	if (lastPage.rowCount <= maxRowsLastPage) {
		lastPage.isLast = true;
	} else {
		pages.push({ items: [], number: lastPage.number + 1, rowCount: 0, isLast: true });
	}

	return pages;
}

export async function createWeeklyBillReport(report: WeeklyBillReport, date: Date): Promise<Report> {
	const sharedColumns = [
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
	];

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
			...sharedColumns,
		],
		summaryRowColumns: sharedColumns,
		summary: [report.totalNetto.toNumber(), report.totalBrutto.toNumber()],
	};
}

export async function createReportDoc(report: Report): Promise<ReportDoc> {
	let top = "Bericht",
		sub = dayjs(report.date).format("DD.MM.YYYY"),
		itemSpecifier = report.itemSpecifier || "";

	switch (report.invoiceSystem) {
		case 0:
			top = "Tagesbericht";
			sub = dayjs(report.date).format("DD.MM.YYYY");
			break;
		case 1:
			top = "Wochenbericht";
			sub = "KW " + getKW(report.date);
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

	const pages = itemsToPages(report.body, false);

	return {
		vendorId: report.id,
		header: {
			top,
			sub,
			itemSpecifier,
		},
		columns: report.columns,
		summaryRowColumns: report.summaryRowColumns,
		summaryColumns: report.summaryColumns,
		body: pages,
		totalPages: pages.length + 1,
		summary: report.summary,
	};
}

export async function createSinglePageExcelReport(doc: ReportDoc): Promise<ExcelJS.Workbook> {
	const workbook = new ExcelJS.Workbook();
	const mainSheet = workbook.addWorksheet(doc.header.itemSpecifier, dinA4ExcelLandscape);

	mainSheet.columns = doc.columns;

	if (doc.body !== undefined)
		doc.body![0].items.forEach((item) => {
			item.rows.forEach((row, i) => {
				mainSheet.insertRow(2 + i, row);
			});
		});

	const summaryRow = 1 + (doc.body ? doc.body![0].items[0].rows.length : 0) + 1;
	mainSheet.insertRow(summaryRow, ["Zusammenfassung", ...doc.summary]);

	boldRow(1, doc, mainSheet);
	boldRow(summaryRow, doc, mainSheet);

	if (doc.vendorId !== undefined)
		await createDocument("report", doc.vendorId, new Date(), "xlsx", doc.header.sub, workbook);

	return workbook;
}

export async function createMultiPageExcelReport(doc: ReportDoc): Promise<ExcelJS.Workbook> {
	const workbook = new ExcelJS.Workbook();
	const mainSheet = workbook.addWorksheet("Zusammenfassung", dinA4ExcelLandscape);

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

	mainSheet.mergeCells("A3:C3");

	const mainSummaryHeaderRow = 5;

	const items = doc.body?.map((r) => r.items).reduce((a, b) => a.concat(b), []);
	items?.forEach((item, i) => {
		const itemSheet = workbook.addWorksheet(item.name, dinA4ExcelLandscape);
		itemSheet.columns = doc.columns;

		item.rows.forEach((row, i) => {
			itemSheet.insertRow(2 + i, row);
		});

		const summaryRow = 2 + item.rows.length;
		itemSheet.insertRow(summaryRow, ["Zusammenfassung", ...item.summary]);

		if (hasMainSummary) mainSheet.insertRow(mainSummaryHeaderRow + i + 1, [item.name, ...item.summary]);

		for (const rowNum of [1, summaryRow]) {
			boldRow(rowNum, doc, itemSheet);
		}
	});

	const summaryRow = mainSummaryHeaderRow + (items?.length || 0) + 1;
	const summary = ["Zusammenfassung", ...doc.summary];

	if (hasMainSummary) mainSheet.insertRow(summaryRow, summary);

	boldRow(mainSummaryHeaderRow, doc, mainSheet);
	boldRow(summaryRow, doc, mainSheet);

	if (doc.vendorId !== undefined)
		await createDocument(
			"report",
			doc.vendorId,
			new Date(),
			"xlsx",
			doc.header.sub,
			await workbook.xlsx.writeBuffer()
		);

	return workbook;
}

export async function createPDFReport(doc: ReportDoc): Promise<Buffer> {
	const template = (await fs.readFile("./templates/report.html")).toString();

	const html = populateTemplateHtml(template, {
		title: "Bericht",
		header: doc.header,
		summaryColumns: doc.summaryColumns,
		pages:
			doc.body?.map((page) => ({
				...page,
				items: page.items.map((item) => {
					return {
						columns: doc.columns,
						...item,
						rows: item.rows.map((row) => applyStyler(row, doc.columns)),
						summary: applyStyler(item.summary, doc.summaryRowColumns!),
					};
				}),
			})) || [],
		summary: doc.summaryColumns !== undefined && applyStyler(doc.summary, doc.summaryColumns),
	});

	const pdf = await generatePDF(html);

	console.log(doc.vendorId);

	if (doc.vendorId !== undefined)
		await createDocument("report", doc.vendorId, new Date(), "pdf", doc.header.sub, pdf);

	return pdf;
}
