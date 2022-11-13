import { Request, Response } from "express";
import { ReportType } from "../models/reports.model.js";
import {
	createAllSalesReport,
	createArticleSalesReport,
	createReportDoc,
	createVendorSalesReport,
} from "../services/reports.service.js";
import { downloadFileHandler } from "./controllers.js";

export async function getArticleSalesReportController(
	req: Request<{ id: string }, any, any, { date: string; invoiceSystem: string; type: ReportType }>,
	res: Response
) {
	await downloadFileHandler(
		async () =>
			createReportDoc(
				await createArticleSalesReport(
					parseInt(req.params.id),
					new Date(req.query.date),
					parseInt(req.query.invoiceSystem)
				),
				req.query.type
			),
		res,
		true
	);
}

export async function getVendorSalesReportController(
	req: Request<{ id: string }, any, any, { date: string; invoiceSystem: string; type: ReportType }>,
	res: Response
) {
	await downloadFileHandler(
		async () =>
			createReportDoc(
				await createVendorSalesReport(
					parseInt(req.params.id),
					new Date(req.query.date),
					parseInt(req.query.invoiceSystem)
				),
				req.query.type
			),
		res,
		true
	);
}

export async function getAllSalesReportController(
	req: Request<any, any, any, { date: string; invoiceSystem: string; type: ReportType }>,
	res: Response
) {
	await downloadFileHandler(
		async () =>
			createReportDoc(
				await createAllSalesReport(new Date(req.query.date), parseInt(req.query.invoiceSystem)),
				req.query.type
			),
		res,
		true
	);
}
