import { Express } from "express";
import {
	getArticlesController,
	postArticleController,
	deleteArticleController,
	putArticleController,
} from "./controllers/article.controller.js";
import logger from "./logger.js";

function routes(app: Express) {
	logger.info("Creating routes");

	app.route("/articles")
		.get(getArticlesController)
		.post(postArticleController)
		.put(putArticleController)
		.delete(deleteArticleController);
}

export default routes;
