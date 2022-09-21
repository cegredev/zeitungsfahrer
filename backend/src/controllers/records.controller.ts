import { Request, Response } from "express";
import { ArticleRecords, VendorRecords } from "../models/records.model.js";
import {
	createOrUpdateArticleRecords,
	getArticleSalesRoute,
	getTodaysArticleRecords as getTodaysRecords,
	getVendorRecordsRoute,
} from "../services/records.service.js";
import { getVendorCatalogRoute, getVendorFullRoute } from "../services/vendors.service.js";
import { handler } from "./controllers.js";

export async function getVendorRecordsController(
	req: Request<{ id: number }, any, any, { end: Date }>,
	res: Response<VendorRecords>
) {
	await handler(async () => await getVendorRecordsRoute(req.params.id, new Date(req.query.end)), res);
}

export async function getArticleSalesController(
	req: Request<any, any, any, { id: string; end: Date }>,
	res: Response<VendorRecords>
) {
	await handler(async () => await getArticleSalesRoute(parseInt(req.query.id), new Date(req.query.end)), res);
}

export async function getTodaysRecordsController(req: Request<{ vendorId: number }>, res: Response) {
	await handler(async () => await getTodaysRecords(req.params.vendorId), res);
}

export async function postArticleRecordsController(req: Request<{ id: number }, any, ArticleRecords>, res: Response) {
	await handler(async () => await createOrUpdateArticleRecords(req.params.id, req.body), res);
}
