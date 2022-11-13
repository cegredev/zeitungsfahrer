import ExcelJS from "exceljs";
import Big from "big.js";
import { getVendorCatalog } from "./vendors.service.js";
import { getArticleRecords, getDateRange } from "./records.service.js";
import { Report, ReportedArticle, ReportType, VendorSalesReport } from "../models/reports.model.js";
import { poolExecute } from "../util.js";
import dayjs from "dayjs";
import { DATE_FORMAT } from "../consts.js";
import { daysBetween } from "../time.js";
import { Record } from "../models/records.model.js";
import { Price } from "../models/articles.model.js";

export async function getArticleSalesReport(articleId: number, date: Date, invoiceSystem: number) {
	const [start, end] = getDateRange(date, invoiceSystem);
	const dateRange = daysBetween(start, end);

	const records = await poolExecute<{ date: Date; supply: number; remissions: number; sales: number }>(
		`SELECT date, supply, remissions, (supply - remissions) AS sales
		 FROM records WHERE article_id=? AND date BETWEEN ? AND ?
		 ORDER BY date`,
		[articleId, dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
	);

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
		columns: [
			{
				header: "Datum",
				width: 20,
			},
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
		],
		date,
		body:
			invoiceSystem === 3
				? undefined
				: data.records.map((r, i) => [startDate.add(i, "days").toDate(), r.supply, r.remissions, r.sales]),
		summary: [data.totalSupply, data.totalRemissions, data.totalSales],
	};
}

export async function getVendorSalesReport(vendorId: number, date: Date, invoiceSystem: number) {
	const catalog = await getVendorCatalog(vendorId);
	const articles = catalog.entries.filter((entry) => entry.included);
	const [start, end] = getDateRange(date, invoiceSystem);
	const numDays = daysBetween(start, end) + 1;

	const recordsByDate: { supply: number; remissions: number; articleId: number; price: Price }[][] = Array(numDays)
		.fill(null)
		.map(() => []);

	let [totalSupply, totalRemissions] = [0, 0];
	const valuesByMwst = new Map<number, Big>();

	for (const { articleId } of articles) {
		const plainRecords = (await getArticleRecords(vendorId, articleId, start, end)).records;
		const records = plainRecords.map((r) =>
			r.missing
				? {
						supply: 0,
						remissions: 0,
						articleId,
						price: r.price!,
				  }
				: {
						supply: r.supply,
						remissions: r.remissions,
						articleId,
						price: r.price!,
				  }
		);

		for (let i = 0; i < records.length; i++) {
			const record = records[i];

			recordsByDate[i].push(record);
			totalSupply += record.supply;
			totalRemissions += record.remissions;

			const sales = record.supply - record.remissions;
			if (sales === 0) continue;

			const value = valuesByMwst.get(record.price.mwst) || new Big(0);
			valuesByMwst.set(record.price.mwst, value.add(Big(sales).mul(record.price.sell)));
		}
	}

	const totalNetto = [...valuesByMwst.values()].reduce((a, b) => a.add(b), Big(0));
	const totalBrutto = [...valuesByMwst.entries()]
		.map(([mwst, value]) => value.mul(1 + mwst / 100))
		.reduce((a, b) => a.add(b), Big(0));

	return {
		articles: new Map(articles.map((article) => [article.articleId, article.articleName])),
		recordsByDate,
		totalSupply,
		totalRemissions,
		totalNetto,
		totalBrutto,
	};
}

export async function createVendorSalesReport(vendorId: number, date: Date, invoiceSystem: number): Promise<Report> {
	const { articles, recordsByDate, totalSupply, totalRemissions, totalNetto, totalBrutto } =
		await getVendorSalesReport(vendorId, date, invoiceSystem);

	const [startDate] = getDateRange(date, invoiceSystem);
	const start = dayjs(startDate);

	return {
		invoiceSystem,
		columns: [
			{
				header: "Datum",
				width: 20,
			},
			{
				header: "Artikel",
				width: 15,
			},
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
			},
			{
				header: "Betrag (Brutto)",
				width: 15,
				style: { numFmt: '#,##0.00 "€"' },
			},
		],
		body: recordsByDate.flat().map((record, i) => {
			const sales = record.supply - record.remissions;
			const value = Big(sales).mul(record.price!.sell);

			return [
				start.add(Math.floor(i / articles.size), "days").toDate(),
				articles.get(record.articleId)!,
				record.supply,
				record.remissions,
				sales,
				value.toNumber(),
				value.mul(1 + record.price!.mwst / 100.0).toNumber(),
			];
		}),
		date,
		summary: [
			"",
			totalSupply,
			totalRemissions,
			totalSupply - totalRemissions,
			totalNetto.toNumber(),
			totalBrutto.toNumber(),
		],
	};
}

export async function createReportDoc(report: Report, type: ReportType): Promise<string> {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet("Bericht");

	sheet.columns = report.columns;

	const rowOffset = 1;

	report.body?.forEach((row, i) => {
		sheet.insertRow(rowOffset + i + 1, row);
	});

	const summaryRow = rowOffset + (report.body?.length || 0) + 2;
	const summary = ["Zusammenfassung", ...report.summary];

	sheet.insertRow(summaryRow - 1, []);
	sheet.insertRow(summaryRow, summary);

	for (let column = 1; column <= summary.length; column++) {
		const cell = sheet.getCell(summaryRow, column);
		cell.style = {
			...cell.style,
			font: {
				...cell.style.font,
				bold: true,
			},
		};
	}

	const fileName = "temp_report_" + new Date().getTime() + ".xlsx";
	await workbook.xlsx.writeFile(fileName);
	return fileName;
}
