import { Express } from "express";
import { getAccountsController, loginController } from "./controllers/accounts.controller.js";
import {
	getArticlesController,
	postArticleController,
	deleteArticleController,
	putArticleController,
	getArticleInfoController,
} from "./controllers/articles.controller.js";
import {
	getArticleSalesController,
	getTodaysRecordsController,
	getVendorRecordsController,
	postArticleRecordsController,
} from "./controllers/records.controller.js";
import { getSettingsController, updateSettingsController } from "./controllers/settings.controller.js";
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

	app.route("/auth/articles")
		.get(getArticlesController)
		.post(postArticleController)
		.put(putArticleController)
		.delete(deleteArticleController);

	app.route("/auth/articles/sales").get(getArticleSalesController);

	app.route("/auth/articles/info").get(getArticleInfoController);

	app.route("/auth/vendors")
		.get(getVendorsController)
		.post(postVendorController)
		.put(putVendorController)
		.delete(deleteVendorController);

	app.route("/auth/vendors/:id").get(getVendorFullController).post(createOrUpdateVendorController);

	app.route("/auth/records/:id").get(getVendorRecordsController).post(postArticleRecordsController);

	app.route("/auth/records/:vendorId/today").get(getTodaysRecordsController);

	app.route("/auth/accounts").get(getAccountsController);

	app.route("/auth/settings").get(getSettingsController).put(updateSettingsController);

	app.route("/login").get(loginController);
}

export default routes;
