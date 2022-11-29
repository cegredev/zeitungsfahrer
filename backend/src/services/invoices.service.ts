import { applyStyler, generatePDF, populateTemplateHtml } from "../pdf.js";
import { createArticleListingReport, getVendorSalesReport } from "./reports.service.js";
import { getVendor } from "./vendors.service.js";
import fs from "fs/promises";
import dayjs from "dayjs";
import { getDateRange } from "./records.service.js";
import Big from "big.js";
import { twoDecimalFormat } from "../consts.js";
import { getKW } from "../time.js";
import { Column } from "../models/reports.model.js";

export async function getInvoiceData(vendorId: number, date: Date, system: number) {
	const vendor = await getVendor(vendorId);
	const report = await createArticleListingReport(await getVendorSalesReport(vendorId, date, system), date, system);

	return {
		vendor,
		date,
		invoiceNr: date.getFullYear() + "-" + getKW(date) + "-AI",
		articles: report.body,
		summary: report.summary,
	};
}

export async function createInvoice(vendorId: number, date: Date, system: number): Promise<Buffer> {
	const invoice = await getInvoiceData(vendorId, date, system);
	console.log("invoice:", invoice);

	const template = (await fs.readFile("./templates/invoice.html")).toString();

	const sharedColumns: Column[] = [
		{},
		{},
		{},
		{ styler: twoDecimalFormat.format },
		{ styler: twoDecimalFormat.format },
		{ styler: twoDecimalFormat.format },
		{ styler: twoDecimalFormat.format },
	];

	const columns = [
		{
			styler: (date: Date) => dayjs(date).format("DD.MM.YYYY"),
		},
		...sharedColumns,
	];

	const summaryColumns = [{}, ...sharedColumns];

	const html = populateTemplateHtml(template, {
		...invoice,
		date: dayjs(date).format("DD.MM.YYYY"),
		tablesPerPage: 3,
		articles: invoice.articles.map((item) => {
			return {
				...item,
				rows: item.rows.map((row) => applyStyler(row, columns)),
				summary: applyStyler(item.summary, summaryColumns),
			};
		}),
		summary: applyStyler(invoice.summary, summaryColumns),
	});

	return await generatePDF(html);
}
