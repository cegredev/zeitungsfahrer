import { Request, Response } from "express";
import { Price } from "../models/article.model.js";
import { getArticles, createArticle, deleteArticle, updateArticle } from "../services/article.service.js";

export async function getArticlesController(req: Request, res: Response) {
	try {
		const articles = await getArticles();
		res.status(200).json(articles);
	} catch (e) {
		res.status(400).send(e);
	}
}

export async function postArticleController(
	req: Request<any, any, { name: string; mwst: number; prices: Price[] }>,
	res: Response
) {
	const { name, mwst, prices } = req.body;

	try {
		await createArticle(name, mwst, prices);
		res.sendStatus(200);
	} catch (e: unknown) {
		// TODO: Use logging framework
		res.status(400).send(e);
	}
}

export function putArticleController(
	req: Request<any, any, { id: number; name: string; mwst: number; prices: Price[] }>,
	res: Response
) {
	try {
		updateArticle(req.body);
		res.sendStatus(200);
	} catch (e) {
		res.status(400).send(e);
	}
}

export function deleteArticleController(req: Request<any, any, { id: number }>, res: Response) {
	try {
		deleteArticle(req.body.id);
		res.sendStatus(200);
	} catch (e) {
		res.status(400).send(e);
	}
}
