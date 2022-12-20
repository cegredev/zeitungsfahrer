import { Request, Response } from "express";
import { CustomInvoiceText } from "../models/invoices.model.js";
import {
	createInvoicePDF,
	deleteInvoice,
	getCustomText,
	getInvoice,
	getInvoiceMeta,
	getInvoices,
	modifyText,
} from "../services/invoices.service.js";
import { downloadPDFHandler, handler, validateVendorAccess } from "./controllers.js";

export async function getInvoiceController(req: Request<{ id: string }>, res: Response) {
	const invoiceId = parseInt(req.params.id);

	const invoiceMeta = await getInvoiceMeta(invoiceId);

	if (!validateVendorAccess(req, invoiceMeta.vendorId)) return res.sendStatus(403);

	await downloadPDFHandler(await getInvoice(invoiceId), res);
}

export async function getInvoicesController(
	req: Request<{ id: string }, any, any, { date: string; system: string }>,
	res: Response
) {
	if (!validateVendorAccess(req, parseInt(req.params.id))) return res.sendStatus(403);

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

export async function deleteInvoiceController(req: Request<{ id: string }>, res: Response) {
	await handler(async () => await deleteInvoice(parseInt(req.params.id)), res);
}
