import { Request, Response } from "express";
import { createInvoice } from "../services/invoices.service.js";
import { downloadPDFHandler } from "./controllers.js";

export async function getInvoiceController(
	req: Request<{ id: string }, any, any, { date: string; system: string }>,
	res: Response
) {
	await downloadPDFHandler(
		await createInvoice(parseInt(req.params.id), new Date(req.query.date), parseInt(req.query.system)),
		res
	);
}
