import { generatePDF, populateTemplateHtml } from "../pdf.js";
import { getVendorSalesReport } from "./reports.service.js";
import { getVendor } from "./vendors.service.js";
import fs from "fs/promises";
import dayjs from "dayjs";
import { getDateRange } from "./records.service.js";
import Big from "big.js";
import { twoDecimalFormat } from "../consts.js";
import { getKW } from "../time.js";

export async function getInvoiceData(vendorId: number, date: Date, system: number) {
	const vendor = await getVendor(vendorId);
	const report = await getVendorSalesReport(vendorId, date, system);

	return {
		vendor,
		date,
		invoiceNr: date.getFullYear() + "-" + getKW(date) + "-AI",
		reports: report.recordsByDate,
		articles: report.articles,
	};
}

export async function createInvoice(vendorId: number, date: Date, system: number): Promise<Buffer> {
	const invoice = await getInvoiceData(vendorId, date, system);
	console.log("invoice:", invoice);

	const template = (await fs.readFile("./templates/invoice.html")).toString();

	const [start] = getDateRange(date, system);

	const html = populateTemplateHtml(template, {
		...invoice,
		date: dayjs(date).format("DD.MM.YYYY"),
		rows: invoice.reports.flat().map((record, i) => [
			dayjs(start)
				.add(Math.floor(i / invoice.articles.size), "days")
				.format("DD.MM.YYYY"),
			invoice.articles.get(record.articleId!),
			record.supply - record.remissions,
			twoDecimalFormat.format(
				Big(record.price!.sell)
					.mul(record.supply - record.remissions)
					.toNumber()
			),
		]),
	});

	return await generatePDF(html);
}
