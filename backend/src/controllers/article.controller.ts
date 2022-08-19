import { NextFunction, Request, Response } from "express";
import { Price } from "../models/article.model";
import { getArticles, createArticle, deleteArticle, updateArticle } from "../services/article.service";

export function getArticlesController(req: Request, res: Response) {
	getArticles((articles) => {
		res.json(articles);
	});
}

export function postArticleController(
	req: Request<any, any, { name: string; mwst: number; prices: Price[] }>,
	res: Response
) {
	console.log(req.body);

	const { name, mwst, prices } = req.body;

	createArticle(name, mwst, prices, (err) => {
		if (err) throw err;

		res.status(200).send();
	});
}

export function putArticleController(
	req: Request<any, any, { id: number; name: string; mwst: number; prices: Price[] }>,
	res: Response
) {
	updateArticle(req.body, (err) => {
		if (err) throw err;

		res.sendStatus(200);
	});
}

export function deleteArticleController(req: Request<any, any, { id: number }>, res: Response) {
	deleteArticle(req.body.id, (err) => {
		if (err) throw err;

		res.sendStatus(200);
	});
}
