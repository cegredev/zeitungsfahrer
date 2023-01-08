import { applyStyler, generatePDF, populateTemplateHtml } from "../pdf.js";
import {
	createArticleListingReport,
	createPDFReport,
	createReportDoc,
	getVendorSalesReport,
	itemsToPages,
} from "./reports.service.js";
import { getVendor } from "./vendors.service.js";
import fs from "fs/promises";
import dayjs from "dayjs";
import { twoDecimalFormatNoCurrency, fourDecimalFormatNoCurrency } from "../consts.js";
import { getKW } from "../time.js";
import { Column } from "../models/reports.model.js";
import { CustomInvoiceText, Invoice, SingleMwstSummary } from "../models/invoices.model.js";
import { withVAT, poolExecute } from "../util.js";
import Big from "big.js";
import { createDocument, storeDocument } from "./documents.service.js";

export async function getInvoiceData(
	vendorId: number,
	date: Date,
	system: number,
	createReport: boolean
): Promise<Invoice> {
	const vendor = await getVendor(vendorId);
	const report = await getVendorSalesReport(vendorId, date, system);

	if (createReport)
		await createPDFReport(await createReportDoc(await createArticleListingReport(report, date, system)));

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

	const id = await createDocument("invoice", vendorId, today, "pdf", description);

	const newItems = report.items.map((item) => {
		let totalNetto = Big(0),
			totalBrutto = Big(0),
			totalSales = 0;

		return {
			name: item.name,
			rows: item.rows.map((row) => {
				let netto = row.price.sell.mul(row.sales);
				const brutto = withVAT(netto, row.price.mwst).round(2);
				netto = netto.round(2);

				totalSales += row.sales;
				totalNetto = totalNetto.add(netto);
				totalBrutto = totalBrutto.add(brutto);

				return [
					row.date,
					row.price.sell.toNumber(),
					withVAT(row.price.sell, row.price.mwst).toNumber(),
					row.sales,
					row.price.mwst,
					netto.toNumber(),
					brutto.toNumber(),
				];
			}),
			summary: ["", "", totalSales, "", totalNetto, totalBrutto],
		};
	});

	let entireBrutto = Big(0);

	const mwstSummaries: SingleMwstSummary[] = [...report.nettoByMwst.entries()].map(([mwst, { netto, brutto }]) => {
		const bruttoTotal = brutto.round(2);
		entireBrutto = entireBrutto.add(bruttoTotal);

		return {
			mwst,
			nettoTotal: netto,
			mwstCut: bruttoTotal.sub(netto),
			bruttoTotal,
		};
	});

	const pages = itemsToPages(newItems, true);

	return {
		vendor,
		date: today,
		nr: {
			date,
			counter: id,
			description,
		},
		mwstSummary: {
			totalBrutto: entireBrutto,
			summaries: mwstSummaries,
		},
		pages,
		totalPages: pages.length + 1,
		summary: [],
	};
}

export async function createInvoicePDF(vendorId: number, date: Date, system: number): Promise<Buffer> {
	const invoice = await getInvoiceData(vendorId, date, system, true);

	const customText = await getCustomText();
	const template = (await fs.readFile("./templates/invoice.html")).toString();

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
		mwstSummary: {
			...invoice.mwstSummary,
			totalBrutto: twoDecimalFormatNoCurrency.format(invoice.mwstSummary.totalBrutto.toNumber()),
			summaries: invoice.mwstSummary.summaries.map((summary) => ({
				...summary,
				nettoTotal: twoDecimalFormatNoCurrency.format(summary.nettoTotal.toNumber()),
				mwstCut: twoDecimalFormatNoCurrency.format(summary.mwstCut.toNumber()),
				bruttoTotal: twoDecimalFormatNoCurrency.format(summary.bruttoTotal.toNumber()),
			})),
		},
		...customText,
	});

	const pdf = await generatePDF(html);

	await storeDocument(invoice.nr.counter, pdf, "invoice");

	return pdf;
}

export async function getCustomText(): Promise<CustomInvoiceText> {
	const res = await poolExecute<{ contact: string; byeText: string; payment: string }>(
		"SELECT contact, bye_text as byeText, payment FROM invoice_profiles"
	);

	return res[0];
}

export async function modifyText({ contact, byeText, payment }: CustomInvoiceText) {
	console.log("updating:", contact, byeText, payment);

	await poolExecute("UPDATE invoice_profiles SET contact=?, bye_text=?, payment=? WHERE id=1", [
		contact,
		byeText,
		payment,
	]);

	return {
		code: 200,
	};
}
