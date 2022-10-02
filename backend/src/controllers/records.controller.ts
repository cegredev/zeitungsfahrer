import { Request, Response } from "express";
import { ArticleRecords, ChangedRecord, VendorRecords } from "../models/records.model.js";
import {
	createOrUpdateArticleRecords,
	getAllSalesRoute,
	getArticleSalesRoute,
	getTodaysArticleRecords as getTodaysRecords,
	getVendorRecordsRoute,
	getVendorSalesRoute,
} from "../services/records.service.js";
import { getVendorCatalogRoute, getVendorFullRoute } from "../services/vendors.service.js";
import { handler } from "./controllers.js";

export async function getVendorRecordsController(
	req: Request<{ id: string }, any, any, { articleId?: string; end: Date }>,
	res: Response<VendorRecords>
) {
	const articleId = req.query.articleId;

	await handler(
		async () =>
			await getVendorRecordsRoute(
				parseInt(req.params.id),
				new Date(req.query.end),
				articleId ? parseInt(articleId) : undefined
			),
		res
	);
}

export async function getArticleSalesController(
	req: Request<any, any, any, { id: string; end: Date }>,
	res: Response<VendorRecords>
) {
	await handler(async () => await getArticleSalesRoute(parseInt(req.query.id), new Date(req.query.end)), res);
}

export async function getVendorSalesController(
	req: Request<{ id: string }, any, any, { date: Date }>,
	res: Response<VendorRecords>
) {
	await handler(async () => await getVendorSalesRoute(parseInt(req.params.id), new Date(req.query.date)), res);
}

export async function getAllSalesController(req: Request<any, any, any, { date: Date }>, res: Response<VendorRecords>) {
	await handler(async () => await getAllSalesRoute(new Date(req.query.date)), res);
}

export async function getTodaysRecordsController(req: Request<{ vendorId: number }>, res: Response) {
	await handler(async () => await getTodaysRecords(req.params.vendorId), res);
}

export async function postArticleRecordsController(req: Request<{ id: number }, any, ChangedRecord[]>, res: Response) {
	await handler(async () => await createOrUpdateArticleRecords(req.params.id, req.body), res);
}
