import { Request, Response } from "express";
import { ArticleRecords, ChangedRecord, VendorRecords } from "../models/records.model.js";
import {
	createOrUpdateArticleRecords,
	getAllSalesRoute,
	getArticleRecordsAdjusted,
	getArticleSalesRoute,
	getTodaysArticleRecords as getTodaysRecords,
	getVendorSalesRoute,
} from "../services/records.service.js";
import { handler } from "./controllers.js";

export async function getArticleRecordsController(
	req: Request<{ id: string }, any, any, { articleId: string; end: Date }>,
	res: Response<VendorRecords>
) {
	await handler(
		async () => ({
			code: 200,
			body: await getArticleRecordsAdjusted(
				parseInt(req.params.id),
				new Date(req.query.end),
				parseInt(req.query.articleId)
			),
		}),
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
