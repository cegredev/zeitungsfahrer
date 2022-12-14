import { applyStyler, generatePDF, populateTemplateHtml } from "../pdf.js";
import { createArticleListingReport, getVendorSalesReport, itemsToPages } from "./reports.service.js";
import { getVendor } from "./vendors.service.js";
import fs from "fs/promises";
import dayjs from "dayjs";
import { twoDecimalFormatNoCurrency, fourDecimalFormatNoCurrency } from "../consts.js";
import { getKW } from "../time.js";
import { Column } from "../models/reports.model.js";
import { CustomInvoiceText, Invoice, InvoiceLink } from "../models/invoices.model.js";
import pool, { RouteReport } from "../database.js";
import { mulWithMwst, poolExecute } from "../util.js";
import { getDateRange } from "./records.service.js";
import Big from "big.js";

export async function getInvoices(vendorId: number, date: Date, system: number): Promise<InvoiceLink[]> {
	const dateRange = getDateRange(date, system);

	const data = await poolExecute<InvoiceLink>(
		"SELECT id, date FROM invoices WHERE vendor_id=? AND date BETWEEN ? AND ? ORDER BY date DESC, id DESC",
		[vendorId, ...dateRange]
	);

	return data;
}

export async function getInvoice(id: number): Promise<Buffer> {
	const response = await poolExecute<{ pdf: Buffer }>("SELECT pdf FROM invoices WHERE id=?", [id]);
	return response[0].pdf;
}

export async function getInvoiceData(vendorId: number, date: Date, system: number): Promise<Invoice> {
	const vendor = await getVendor(vendorId);
	const report = await getVendorSalesReport(vendorId, date, system);

	const today = new Date();
	let description = "" + date.getFullYear();
	switch (system) {
		case 0:
			description += "-" + date.getMonth() + "-" + date.getDate();
			break;
		case 1:
			description += "-" + getKW(date);
			break;
	}
	const result = await pool.execute("INSERT INTO invoices (vendor_id, date, description) VALUES (?, ?, ?)", [
		vendorId,
		dayjs(today).format("YYYY-MM-DD"),
		description,
	]);

	// @ts-ignore
	const id: number = result[0].insertId;

	const newItems = report.items.map((item) => {
		let totalNetto = Big(0),
			totalBrutto = Big(0),
			totalSales = 0;

		return {
			name: item.name,
			rows: item.rows.map((row) => {
				const netto = row.price.sell.mul(row.sales);
				const brutto = mulWithMwst(netto, row.price.mwst);

				totalSales += row.sales;
				totalNetto = totalNetto.add(netto);
				totalBrutto = totalBrutto.add(brutto);

				return [
					row.date,
					row.price.sell.toNumber(),
					mulWithMwst(row.price.sell, row.price.mwst).toNumber(),
					row.sales,
					row.price.mwst,
					netto.toNumber(),
					brutto.toNumber(),
				];
			}),
			summary: ["", "", totalSales, "", totalNetto, totalBrutto],
		};
	});

	const pages = itemsToPages(newItems);

	console.log(pages);

	return {
		vendor,
		date: today,
		nr: {
			date,
			counter: id,
			description,
		},
		pages,
		totalPages: pages.length + 1,
		summary: [],
	};
}

export async function createInvoicePDF(vendorId: number, date: Date, system: number): Promise<Buffer> {
	const invoice = await getInvoiceData(vendorId, date, system);

	const customText = await getCustomText();
	const template = (await fs.readFile("./templates/new_invoice.html")).toString();

	const sharedColumns: Column[] = [
		{ styler: twoDecimalFormatNoCurrency.format },
		{ styler: twoDecimalFormatNoCurrency.format },
	];

	const columns = [
		{ styler: (date: Date) => dayjs(date).format("DD.MM.YYYY") },
		{ styler: fourDecimalFormatNoCurrency.format },
		{ styler: fourDecimalFormatNoCurrency.format },
		{},
		{},
		...sharedColumns,
	];

	const summaryColumns = [{}, {}, {}, {}, ...sharedColumns];

	const html = populateTemplateHtml(template, {
		...invoice,
		date: dayjs(invoice.date).format("DD.MM.YYYY"),
		invoiceIdentifier: invoice.nr.counter + "-" + invoice.nr.description,
		pages: invoice.pages.map((page) => ({
			...page,
			items: page.items.map((item) => {
				return {
					...item,
					rows: item.rows.map((row) => applyStyler(row, columns)),
					summary: applyStyler(item.summary, summaryColumns),
				};
			}),
		})),
		summary: applyStyler(invoice.summary, summaryColumns),
		...customText,
	});

	const pdf = await generatePDF(html);

	await storeInvoice(invoice.nr.counter, pdf);

	return pdf;
}

export async function storeInvoice(id: number, blob: Buffer): Promise<void> {
	await poolExecute("UPDATE invoices SET  pdf=? WHERE id=?", [blob, id]);
}

export async function getCustomText(): Promise<CustomInvoiceText> {
	const res = await poolExecute<{ contact: string; byeText: string; payment: string }>(
		"SELECT contact, bye_text as byeText, payment FROM invoice_profiles"
	);

	console.log(res[0]);

	return res[0];
}

export async function modifyText({ contact, byeText, payment }: CustomInvoiceText) {
	await poolExecute("UPDATE invoice_profiles SET contact=?, bye_text=?, payment=? WHERE id=1", [
		contact,
		byeText,
		payment,
	]);

	return {
		code: 200,
	};
}

export async function deleteInvoice(id: number): Promise<RouteReport> {
	await poolExecute("DELETE FROM invoices WHERE id=?", [id]);

	return { code: 200 };
}
