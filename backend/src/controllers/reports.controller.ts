import { Request, Response } from "express";
import { getArticleSalesReport, getVendorSalesReport } from "../services/reports.service.js";
import { handler } from "./controllers.js";

export async function getArticleSalesReportController(
	req: Request<{ id: string }, any, any, { start: string; end: string }>,
	res: Response
) {
	await handler(
		async () => ({
			code: 200,
			body: await getArticleSalesReport(
				parseInt(req.params.id),
				new Date(req.query.start),
				new Date(req.query.end)
			),
		}),
		res
	);
}

export async function getVendorSalesReportController(
	req: Request<{ id: string }, any, any, { start: string; end: string }>,
	res: Response
) {
	await handler(
		async () => ({
			code: 200,
			body: await getVendorSalesReport(
				parseInt(req.params.id),
				new Date(req.query.start),
				new Date(req.query.end)
			),
		}),
		res
	);
}
