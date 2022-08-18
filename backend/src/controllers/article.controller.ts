import { NextFunction, Request, Response } from "express";
import { getArticles } from "../services/article.service";

export function getArticlesController(req: Request, res: Response, next: NextFunction) {
	getArticles((articles) => {
		res.json(articles);
	});
}
