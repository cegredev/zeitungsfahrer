import { Request, Response } from "express";
import { ArticleInfo, Price } from "shared/src/models/article.js";
import { getArticles, createArticle, deleteArticle, updateArticle } from "../services/article.service.js";

export async function getArticlesController(req: Request, res: Response) {
	try {
		const articles = await getArticles();
		res.status(200).json(articles);
	} catch (e) {
		res.status(400).send(e);
	}
}

export async function postArticleController(req: Request<any, any, ArticleInfo>, res: Response) {
	const { name, mwst } = req.body.data;

	try {
		const id = await createArticle(name, mwst, req.body.prices);
		res.status(200).send({ id });
	} catch (e: unknown) {
		console.error(e);
		// TODO: Use logging framework
		res.status(400).send(e);
	}
}

export async function putArticleController(req: Request<any, any, ArticleInfo>, res: Response) {
	try {
		await updateArticle(req.body);
		res.sendStatus(200);
	} catch (e) {
		res.status(400).send(e);
	}
}

export async function deleteArticleController(req: Request<any, any, { id: number }>, res: Response) {
	try {
		await deleteArticle(req.body.id);
		res.sendStatus(200);
	} catch (e) {
		res.status(400).send(e);
	}
}
