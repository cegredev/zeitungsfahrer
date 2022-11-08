import { Request, Response } from "express";
import {
	createVendorSalesReportDoc,
	getArticleSalesReport,
	getVendorSalesReport,
} from "../services/reports.service.js";
import { handler } from "./controllers.js";
import path from "path";

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
	req: Request<{ id: string }, any, any, { date: string; invoiceSystem: string }>,
	res: Response
) {
	const file = await createVendorSalesReportDoc(
		parseInt(req.params.id),
		new Date(req.query.date),
		parseInt(req.query.invoiceSystem)
	);

	res.sendFile(path.join(process.cwd(), file), (err) => {
		if (err) console.error(err);
	});
}
