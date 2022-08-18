import { NextFunction, Request, Response } from "express";
import { Price } from "../models/article.model";
import { getArticles, createArticle } from "../services/article.service";

export function getArticlesController(req: Request, res: Response) {
	getArticles((articles) => {
		res.json(articles);
	});
}

export function createArticleController(
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
