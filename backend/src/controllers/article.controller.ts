import { Request, Response } from "express";
import { Article } from "../models//article.model.js";
import { getArticles, createArticle, deleteArticle, updateArticle } from "../services/article.service.js";
import { handler } from "./controllers.js";

export async function getArticlesController(req: Request, res: Response) {
	await handler(getArticles, res);
}

export async function postArticleController(req: Request<any, any, Article>, res: Response) {
	const { name, prices } = req.body;

	await handler(async () => await createArticle(name, prices), res);
}

export async function putArticleController(req: Request<any, any, Article>, res: Response) {
	await handler(async () => await updateArticle(req.body), res);
}

export async function deleteArticleController(req: Request<any, any, { id: number }>, res: Response) {
	await handler(async () => await deleteArticle(req.body.id), res);
}
