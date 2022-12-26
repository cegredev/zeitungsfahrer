import { Request, Response } from "express";
import { CustomInvoiceText } from "../models/invoices.model.js";
import { createInvoicePDF, getCustomText, modifyText } from "../services/invoices.service.js";
import { downloadPDFHandler, handler } from "./controllers.js";

export async function createInvoiceController(
	req: Request<{ id: string }, any, any, { date: string; system: string }>,
	res: Response
) {
	await downloadPDFHandler(
		await createInvoicePDF(parseInt(req.params.id), new Date(req.query.date), parseInt(req.query.system)),
		res
	);
}

export async function getCustomInvoiceTextController(req: Request, res: Response) {
	await handler(
		async () => ({
			code: 200,
			body: await getCustomText(),
		}),
		res
	);
}

export async function modifyTextController(req: Request<any, any, CustomInvoiceText>, res: Response) {
	await handler(async () => await modifyText(req.body), res);
}
