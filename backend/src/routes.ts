import { Express } from "express";
import {
	getArticlesController,
	postArticleController,
	deleteArticleController,
	putArticleController,
} from "./controllers/article.controller.js";
import {
	createOrUpdateVendorCatalogController,
	getVendorCatalogController,
} from "./controllers/venderCatalog.controller.js";
import {
	getVendorFullController,
	getVendorWeekController,
	postSellingDaysController,
} from "./controllers/vendor.controller.js";
import {
	deleteVendorController,
	getVendorsController,
	postVendorController,
	putVendorController,
} from "./controllers/vendors.controller.js";

import logger from "./logger.js";

function routes(app: Express) {
	logger.info("Creating routes");

	app.route("/articles")
		.get(getArticlesController)
		.post(postArticleController)
		.put(putArticleController)
		.delete(deleteArticleController);

	app.route("/vendors")
		.get(getVendorsController)
		.post(postVendorController)
		.put(putVendorController)
		.delete(deleteVendorController);

	app.route("/vendors/:id").get(getVendorFullController).post(createOrUpdateVendorCatalogController);
}

export default routes;
