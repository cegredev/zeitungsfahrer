import { Request, Response } from "express";
import { DocType } from "../models/documents.model.js";
import { deleteDocument, getDocument, getDocumentMeta, getDocuments } from "../services/documents.service.js";
import { downloadPDFHandler, handler, validateVendorAccess } from "./controllers.js";

export async function getDocumentController(req: Request<{ type: DocType; id: string }>, res: Response) {
	const invoiceId = parseInt(req.params.id);
	const type = req.params.type;

	const meta = await getDocumentMeta(invoiceId, type);

	if (!validateVendorAccess(req, meta.vendorId)) return res.sendStatus(403);

	await downloadPDFHandler((await getDocument(invoiceId, type)).data, res);
}

export async function getDocumentsController(
	req: Request<{ id: string }, any, any, { date: string; system: string }>,
	res: Response
) {
	if (!validateVendorAccess(req, parseInt(req.params.id))) return res.sendStatus(403);

	await handler(
		async () => ({
			code: 200,
			body: await getDocuments(parseInt(req.params.id), new Date(req.query.date), parseInt(req.query.system)),
		}),
		res
	);
}

export async function deleteDocumentController(
	req: Request<any, any, any, { id: string; type: DocType }>,
	res: Response
) {
	await handler(async () => ({ code: 200, body: await deleteDocument(parseInt(req.query.id), req.query.type) }), res);
}
