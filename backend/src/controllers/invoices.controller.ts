import { Request, Response } from "express";
import { createInvoicePDF, getInvoice, getInvoices } from "../services/invoices.service.js";
import { downloadPDFHandler, handler } from "./controllers.js";

export async function getInvoiceController(req: Request<{ id: string }>, res: Response) {
	await downloadPDFHandler(await getInvoice(parseInt(req.params.id)), res);
}

export async function getInvoicesController(
	req: Request<{ id: string }, any, any, { date: string; system: string }>,
	res: Response
) {
	await handler(
		async () => ({
			code: 200,
			body: await getInvoices(parseInt(req.params.id), new Date(req.query.date), parseInt(req.query.system)),
		}),
		res
	);
}

export async function createInvoiceController(
	req: Request<{ id: string }, any, any, { date: string; system: string }>,
	res: Response
) {
	await downloadPDFHandler(
		await createInvoicePDF(parseInt(req.params.id), new Date(req.query.date), parseInt(req.query.system)),
		res
	);
}
