import { Request, Response } from "express";
import { createArticleSalesReport, createReportDoc, createVendorSalesReport } from "../services/reports.service.js";
import { downloadFileHandler } from "./controllers.js";

export async function getArticleSalesReportController(
	req: Request<{ id: string }, any, any, { date: string; invoiceSystem: string }>,
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
				"excel"
			),
		res,
		true
	);
}

export async function getVendorSalesReportController(
	req: Request<{ id: string }, any, any, { date: string; invoiceSystem: string }>,
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
				"excel"
			),
		res,
		true
	);
}
