import { Request, Response } from "express";
import { Report, ReportType } from "../models/reports.model.js";
import {
	createArticleSalesReport,
	createReportDoc,
	createArticleListingReport,
	getVendorSalesReport,
	getAllSalesReport,
	createExcelReport,
	createPDFReport,
	createWeeklyBillReport,
	getWeeklyBillReport,
} from "../services/reports.service.js";
import { downloadFileHandler } from "./controllers.js";

async function downloadReportHandler(generator: () => Promise<Report>, type: ReportType, res: Response) {
	const doc = await createReportDoc(await generator());

	await downloadFileHandler(
		async () => (type === "excel" ? await createExcelReport(doc) : await createPDFReport(doc)),
		res,
		true
	);
}

export async function getArticleSalesReportController(
	req: Request<{ id: string }, any, any, { date: string; invoiceSystem: string; type: ReportType }>,
	res: Response
) {
	await downloadReportHandler(
		async () =>
			await createArticleSalesReport(
				parseInt(req.params.id),
				new Date(req.query.date),
				parseInt(req.query.invoiceSystem)
			),
		req.query.type,
		res
	);
}

export async function getVendorSalesReportController(
	req: Request<{ id: string }, any, any, { date: string; invoiceSystem: string; type: ReportType }>,
	res: Response
) {
	const date = new Date(req.query.date);
	const invoiceSystem = parseInt(req.query.invoiceSystem);

	await downloadReportHandler(
		async () =>
			await createArticleListingReport(
				await getVendorSalesReport(parseInt(req.params.id), date, invoiceSystem),
				date,
				invoiceSystem
			),
		req.query.type,
		res
	);
}

export async function getAllSalesReportController(
	req: Request<any, any, any, { date: string; invoiceSystem: string; type: ReportType }>,
	res: Response
) {
	const date = new Date(req.query.date);
	const invoiceSystem = parseInt(req.query.invoiceSystem);

	await downloadReportHandler(
		async () => await createArticleListingReport(await getAllSalesReport(date, invoiceSystem), date, invoiceSystem),
		req.query.type,
		res
	);
}

export async function getWeeklyBillReportController(
	req: Request<any, any, any, { date: string; type: ReportType }>,
	res: Response
) {
	const date = new Date(req.query.date);

	await downloadReportHandler(
		async () => await createWeeklyBillReport(await getWeeklyBillReport(date), date),
		req.query.type,
		res
	);
}
