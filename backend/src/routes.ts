import { Express } from "express";
import { getAccountsController } from "./controllers/accounts.controller.js";
import {
	getArticlesController,
	postArticleController,
	deleteArticleController,
	putArticleController,
} from "./controllers/articles.controller.js";
import {
	getTodaysRecordsController,
	getVendorRecordsController,
	postArticleRecordsController,
} from "./controllers/records.controller.js";
import {
	createOrUpdateVendorController,
	deleteVendorController,
	getVendorFullController,
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

	app.route("/vendors/:id").get(getVendorFullController).post(createOrUpdateVendorController);

	app.route("/records/:id").get(getVendorRecordsController).post(postArticleRecordsController);

	app.route("/records/:vendorId/today").get(getTodaysRecordsController);

	app.route("/accounts").get(getAccountsController);
}

export default routes;
