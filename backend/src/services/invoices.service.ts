import { applyStyler, generatePDF, populateTemplateHtml } from "../pdf.js";
import { createArticleListingReport, getVendorSalesReport, tablesPerPageFor } from "./reports.service.js";
import { getVendor } from "./vendors.service.js";
import fs from "fs/promises";
import dayjs from "dayjs";
import { DATE_FORMAT, twoDecimalFormat } from "../consts.js";
import { getKW } from "../time.js";
import { Column } from "../models/reports.model.js";
import { Invoice } from "../models/invoices.model.js";
import pool from "../database.js";
import { ensureDirExists, fileExists } from "../files.js";

export async function getInvoiceData(vendorId: number, date: Date, system: number): Promise<Invoice> {
	const vendor = await getVendor(vendorId);
	const report = await createArticleListingReport(await getVendorSalesReport(vendorId, date, system), date, system);

	const today = new Date();

	const response = await pool.execute("INSERT INTO invoices (vendor_id, date) VALUES (?, ?)", [
		vendorId,
		dayjs(today).format(DATE_FORMAT),
	]);

	// @ts-ignore
	const id: number = response[0].insertId;

	return {
		vendor,
		date: today,
		nr: {
			year: today.getFullYear(),
			week: getKW(today),
			counter: id,
		},
		articles: report.body,
		summary: report.summary,
	};
}

export async function createInvoice(vendorId: number, date: Date, system: number): Promise<Buffer> {
	const invoice = await getInvoiceData(vendorId, date, system);

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
		date: dayjs(invoice.date).format("DD.MM.YYYY"),
		tablesPerPage: tablesPerPageFor(system),
		articles: invoice.articles.map((item) => {
			return {
				...item,
				rows: item.rows.map((row) => applyStyler(row, columns)),
				summary: applyStyler(item.summary, summaryColumns),
			};
		}),
		summary: applyStyler(invoice.summary, summaryColumns),
	});

	const pdf = await generatePDF(html);

	if (await fileExists(await storeInvoice(invoice.nr.counter, vendorId, pdf))) {
		return pdf;
	} else {
		throw new Error("PDF could not be saved!");
	}
}

export async function storeInvoice(id: number, vendorId: number, blob: Buffer): Promise<string> {
	const dir = `./store/invoices/${vendorId}`;

	await ensureDirExists(dir);

	const path = `${dir}/${id}.pdf`;
	await fs.writeFile(path, blob);

	return path;
}
