import { Request, Response } from "express";
import { ArticleInfo } from "shared/src/models/article.js";
import { RouteReport } from "../database.js";
import logger from "../logger.js";
import { getArticles, createArticle, deleteArticle, updateArticle } from "../services/article.service.js";

async function handler(func: () => Promise<RouteReport>, res: Response) {
	try {
		const { code, body } = await func();
		res.status(code).send(body);
	} catch (e) {
		console.error(e);
		logger.error(e);
		res.sendStatus(500);
	}
}

export async function getArticlesController(req: Request, res: Response) {
	await handler(getArticles, res);
}

export async function postArticleController(req: Request<any, any, ArticleInfo>, res: Response) {
	const { name, mwst } = req.body.data;

	await handler(async () => await createArticle(name, mwst, req.body.prices), res);
}

export async function putArticleController(req: Request<any, any, ArticleInfo>, res: Response) {
	await handler(async () => await updateArticle(req.body), res);
}

export async function deleteArticleController(req: Request<any, any, { id: number }>, res: Response) {
	await handler(async () => await deleteArticle(req.body.id), res);
}
