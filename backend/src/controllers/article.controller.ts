import { Request, Response } from "express";
import { Article } from "../models//article.model.js";
import {
	getArticles,
	createArticle,
	deleteArticle,
	updateArticle,
	getTodaysArticleRecords,
} from "../services/article.service.js";
import { handler } from "./controllers.js";

export async function getArticlesController(req: Request<any, any, any, { atDate: Date }>, res: Response) {
	await handler(() => getArticles(req.query.atDate), res);
}

export async function getTodaysArticleRecordsController(req: Request<{ vendorId: number }>, res: Response) {
	await handler(async () => await getTodaysArticleRecords(req.params.vendorId), res);
}

export async function postArticleController(req: Request<any, any, Article>, res: Response) {
	const { name, prices } = req.body;

	await handler(async () => await createArticle(name, prices), res);
}

interface PutBody {
	startDate: Date;
	article: Article;
}

export async function putArticleController(req: Request<any, any, PutBody>, res: Response) {
	const { startDate, article } = req.body;

	await handler(async () => await updateArticle(startDate, article), res);
}

export async function deleteArticleController(req: Request<any, any, { id: number }>, res: Response) {
	await handler(async () => await deleteArticle(req.body.id), res);
}
