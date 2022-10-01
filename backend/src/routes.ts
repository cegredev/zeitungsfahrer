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
	getAllSalesController,
	getArticleSalesController,
	getTodaysRecordsController,
	getVendorRecordsController,
	getVendorSalesController,
	postArticleRecordsController,
} from "./controllers/records.controller.js";
import { getCalendarController, updateCalendarController } from "./controllers/schedule.controller.js";
import {
	getSettingsController,
	settingsLoginController,
	updateSettingsController,
} from "./controllers/settings.controller.js";
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

	app.route("/auth/vendors/:id/sales").get(getVendorSalesController);

	app.route("/auth/records/:id").get(getVendorRecordsController).post(postArticleRecordsController);

	app.route("/auth/records/:vendorId/today").get(getTodaysRecordsController);

	app.route("/auth/dashboard/allSales").get(getAllSalesController);

	app.route("/auth/calendar").get(getCalendarController).post(updateCalendarController);

	app.route("/auth/accounts").get(getAccountsController);

	app.route("/auth/settings").get(getSettingsController).put(updateSettingsController);

	app.route("/auth/settings/login").get(settingsLoginController);

	app.route("/login").get(loginController);
}

export default routes;
