import { Express, NextFunction, Request, Response } from "express";
import {
	getArticlesController,
	postArticleController,
	deleteArticleController,
	putArticleController,
} from "./controllers/article.controller";

function routes(app: Express) {
	function handleGetBookOne(request: Request, response: Response, next: NextFunction) {
		console.log("get^1");
		next();
	}

	function handleGetBookTwo(request: Request, response: Response, next: NextFunction) {
		return response.send("You made a book get request2");
	}

	app.route("/articles")
		.get(getArticlesController)
		.post(postArticleController)
		.put(putArticleController)
		.delete(deleteArticleController);

	app.route("/ab*cd")
		.get([handleGetBookOne, handleGetBookTwo])
		.post((req, res) => {
			return res.send("You made a POST request");
		});

	app.post("/api/data", (req, res) => {
		console.log(req.body);

		return res.sendStatus(200);
	});

	app.get("/error", () => {
		throw new Error("booM!");
	});

	app.all("/api/all", (req, res) => {
		return res.sendStatus(200);
	});
}

export default routes;
