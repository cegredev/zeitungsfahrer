import { Request, Response } from "express";
import { Article } from "../models/articles.model.js";
import {
	getArticles,
	createArticle,
	deleteArticle,
	updateArticle,
	getArticleInfosRoute,
} from "../services/articles.service.js";
import { handler } from "./controllers.js";

export async function getArticlesController(req: Request<any, any, any, { atDate: Date }>, res: Response) {
	await handler(() => getArticles(req.query.atDate), res);
}

export async function getArticleInfoController(req: Request, res: Response) {
	await handler(getArticleInfosRoute, res);
}

export async function postArticleController(req: Request<any, any, Article>, res: Response) {
	const { name, prices } = req.body;

	await handler(async () => await createArticle(name, prices), res);
}

export async function putArticleController(
	req: Request<
		any,
		any,
		{
			startDate: Date;
			article: Article;
		}
	>,
	res: Response
) {
	const { startDate, article } = req.body;

	await handler(async () => await updateArticle(startDate, article), res);
}

export async function deleteArticleController(req: Request<any, any, { id: number }>, res: Response) {
	await handler(async () => await deleteArticle(req.body.id), res);
}
