import Big from "big.js";
import dayjs from "dayjs";
import { DATE_FORMAT, fourDecimalFormatNoCurrency, twoDecimalFormat, twoDecimalFormatNoCurrency } from "../consts.js";
import { Amount, ArticleReport, ReportRecord, ReportSummary } from "../models/new_reports.model.js";
import { withVAT, poolExecute } from "../util.js";
import { applyPrices } from "./records.service.js";
import fs from "fs/promises";
import { generatePDF, populateTemplateHtml } from "../pdf.js";

export const MAX_DIGITS = 2;

export async function getArticleSalesReportNew(
	articleId: number,
	start: Date,
	end: Date,
	vendorId?: number
): Promise<ArticleReport> {
	const sqlArgs = [articleId, dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)];
	if (vendorId !== undefined) sqlArgs.push(vendorId);

	console.log(start, end);

	const initialRecords = (
		await poolExecute<{ date: Date; supply: string; remissions: string; sales: string }>(
			`SELECT date, SUM(supply) as supply, SUM(remissions) as remissions, SUM(supply - remissions) AS sales
		 FROM records WHERE article_id=? AND date BETWEEN ? AND ? ${vendorId === undefined ? "" : "AND vendor_id=?"} 
		 GROUP BY date ORDER BY date
		 `,
			sqlArgs
		)
	).map((record) => ({
		...record,
		supply: parseInt(record.supply),
		remissions: parseInt(record.remissions),
		sales: parseInt(record.sales),
	}));

	await applyPrices(start, end, [{ id: articleId, records: initialRecords }]);

	// @ts-ignore
	const records: ReportRecord[] = initialRecords;

	const summary: ReportSummary = {
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

	for (const { supply, remissions, sales, price } of records) {
		summary.basic!.supply += supply;
		summary.basic!.remissions += remissions;
		summary.basic!.sales += sales;

		for (const [priceValue, amount] of <[Big, Amount][]>[
			[price.purchase, summary.purchase!],
			[price.sell, summary.sell!],
			[price.marketSell, summary.marketSell!],
		]) {
			const netto = priceValue.mul(sales).round(MAX_DIGITS);

			amount.netto = amount.netto.add(netto);
			amount.brutto = amount.brutto.add(withVAT(netto, price.mwst));
		}
	}

	return {
		articleId,
		vendorId,
		records,
		summary,
	};
}

export async function renderArticleSalesReport(report: ArticleReport) {}

type Styler = (arg: any) => string;

const DATE_STYLER = (date: Date) => dayjs(date).format("DD.MM.YYYY");
const TWO_DEC_STYLER = (value: Big) => twoDecimalFormatNoCurrency.format(value.toNumber());
const FOUR_DEC_STYLER = (value: Big) => fourDecimalFormatNoCurrency.format(value.toNumber());


function printifyTable(
	report: ArticleReport,
	dataColumns: Styler[],
	summaryColumns: Styler[]
): { rows: string[][]; summary: string[] } {
	const rows = report.records.map((record) => record.)
}

export async function renderAnyReport(templateFile: string, data: any) {
	const template = (await fs.readFile("./templates/" + templateFile)).toString();

	const html = populateTemplateHtml(template, data);

	const pdf = await generatePDF(html);

	return pdf;
}
