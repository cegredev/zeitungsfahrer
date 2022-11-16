import ExcelJS from "exceljs";
import Big from "big.js";
import { getVendorCatalog, getVendorSimple } from "./vendors.service.js";
import { applyPrices, getArticleRecords, getDateRange } from "./records.service.js";
import { Report, ReportDoc, ReportedArticle, ReportType, VendorSalesReport } from "../models/reports.model.js";
import { poolExecute } from "../util.js";
import dayjs from "dayjs";
import { DATE_FORMAT, months } from "../consts.js";
import { daysBetween, getKW } from "../time.js";
import { Record } from "../models/records.model.js";
import { Price } from "../models/articles.model.js";
import { getArticleInfos } from "./articles.service.js";

function calculateTotalValues(byMwst: Map<number, Big>): [Big, Big] {
	const totalNetto = [...byMwst.values()].reduce((a, b) => a.add(b), Big(0));
	const totalBrutto = [...byMwst.entries()]
		.map(([mwst, value]) => value.mul(1 + mwst / 100))
		.reduce((a, b) => a.add(b), Big(0));

	return [totalNetto, totalBrutto];
}

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

interface ArticleListingReport {
	articles: Map<number, string>;
	owner: string;
	recordsByDate: Record[][];
	totalSupply: number;
	totalRemissions: number;
	totalNetto: Big;
	totalBrutto: Big;
}

export async function getVendorSalesReport(
	vendorId: number,
	date: Date,
	invoiceSystem: number
): Promise<ArticleListingReport> {
	const catalog = await getVendorCatalog(vendorId);
	const articles = catalog.entries.filter((entry) => entry.included);
	const [start, end] = getDateRange(date, invoiceSystem);
	const numDays = daysBetween(start, end) + 1;

	const recordsByDate: Record[][] = Array(numDays)
		.fill(null)
		.map(() => []);

	let [totalSupply, totalRemissions] = [0, 0];
	const valuesByMwst = new Map<number, Big>();

	for (const { articleId } of articles) {
		const plainRecords = (await getArticleRecords(vendorId, articleId, start, end)).records;
		const records = plainRecords.map((r) =>
			r.missing
				? {
						date: r.date,
						supply: 0,
						remissions: 0,
						articleId,
						price: r.price!,
				  }
				: {
						date: r.date,
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

	const [totalNetto, totalBrutto] = calculateTotalValues(valuesByMwst);

	return {
		articles: new Map(articles.map((article) => [article.articleId, article.articleName])),
		owner: (await getVendorSimple(vendorId)).name,
		recordsByDate,
		totalSupply,
		totalRemissions,
		totalNetto,
		totalBrutto,
	};
}

export async function createArticleListingReport(
	{ articles, owner, recordsByDate, totalSupply, totalRemissions, totalNetto, totalBrutto }: ArticleListingReport,
	date: Date,
	invoiceSystem: number
): Promise<Report> {
	const [startDate] = getDateRange(date, invoiceSystem);
	const start = dayjs(startDate);

	return {
		invoiceSystem,
		itemSpecifier: owner,
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
			const value = sales > 0 ? Big(sales).mul(record.price!.sell) : Big(0);

			return [
				start.add(Math.floor(i / articles.size), "days").toDate(),
				articles.get(record.articleId!)!,
				record.supply,
				record.remissions,
				sales,
				value.toNumber(),
				value.eq(0) ? 0 : value.mul(1 + record.price!.mwst / 100.0).toNumber(),
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

export async function getAllSalesReport(date: Date, invoiceSystem: number): Promise<ArticleListingReport> {
	const [start, end] = getDateRange(date, invoiceSystem);
	const numDays = daysBetween(start, end) + 1;
	const articles = await getArticleInfos();

	const startDate = dayjs(start);

	const recordsByDate: Record[][] = Array(numDays)
		.fill(null)
		.map((_, day) =>
			Array(articles.length)
				.fill(null)
				.map((_, i) => ({
					date: startDate.add(day, "days").toDate(),
					articleId: articles[i].id,
					supply: 0,
					remissions: 0,
				}))
		);

	const valuesByMwst = new Map<number, Big>();

	let articleIndex = 0,
		totalSupply = 0,
		totalRemissions = 0;
	for (const { id } of articles) {
		const records = (
			await poolExecute<Record>(
				`SELECT date, article_id as articleId, SUM(supply) AS supply, SUM(remissions) AS remissions FROM records
			 WHERE article_id=? AND date BETWEEN ? AND ?
			 GROUP BY vendor_id, date`,
				[id, dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
			)
		)
			// SUM(...) returns a DECIMAL, which is why we have to cast to int
			.map((r) => ({
				...r,
				supply: parseInt(String(r.supply)),
				remissions: parseInt(String(r.remissions)),
			}));

		await applyPrices(start, end, [{ id, records }]);

		records.forEach((record) => {
			totalSupply += record.supply;
			totalRemissions += record.remissions;

			const value = valuesByMwst.get(record.price!.mwst) || Big(0);
			valuesByMwst.set(
				record.price!.mwst,
				value.add(Big(record.supply - record.remissions).mul(record.price!.sell))
			);

			recordsByDate[daysBetween(start, record.date)][articleIndex] = record;
		});

		articleIndex++;
	}

	const [totalNetto, totalBrutto] = calculateTotalValues(valuesByMwst);

	return {
		articles: new Map(articles.map((article) => [article.id, article.name])),
		owner: "Gesamt",
		recordsByDate,
		totalSupply,
		totalRemissions,
		totalNetto,
		totalBrutto,
	};
}

export async function createReportDoc(report: Report): Promise<ReportDoc> {
	let header = {
		top: "Bericht",
		sub: dayjs(report.date).format("DD.MM.YYYY"),
		itemSpecifier: report.itemSpecifier || "",
	};
	switch (report.invoiceSystem) {
		case 0:
			header = {
				top: "Tagesbericht",
				sub: dayjs(report.date).format("DD.MM.YYYY"),
				itemSpecifier: report.itemSpecifier || "",
			};
			break;
		case 1:
			header = {
				top: "Wochenbericht",
				sub: "KW " + getKW(report.date),
				itemSpecifier: report.itemSpecifier || "",
			};
			break;
		case 2:
			header = {
				top: "Monatsbericht",
				sub: months[report.date.getMonth()],
				itemSpecifier: report.itemSpecifier || "",
			};
			break;
		case 3:
			header = {
				top: "Jahresbericht",
				sub: "" + report.date.getFullYear(),
				itemSpecifier: report.itemSpecifier || "",
			};
			break;
	}

	return {
		header,
		columns: report.columns,
		body: report.body,
		summary: report.summary,
	};
}

export async function createExcelReport(doc: ReportDoc): Promise<string> {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet("Bericht");

	sheet.columns = doc.columns;

	sheet.insertRow(1, []);

	for (const text of [doc.header.itemSpecifier, doc.header.sub, doc.header.top]) sheet.insertRow(1, [text]);

	const rowOffset = 5;

	doc.body?.forEach((row, i) => {
		sheet.insertRow(rowOffset + i + 1, row);
	});

	const summaryRow = rowOffset + (doc.body?.length || 0) + 2;
	const summary = ["Zusammenfassung", ...doc.summary];

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

export async function createPDFReport(doc: ReportDoc): Promise<string> {
	return "";
}
