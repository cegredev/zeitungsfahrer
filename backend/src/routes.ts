import { Express } from "express";
import { getAccountsController, loginController } from "./controllers/accounts.controller.js";
import {
	getArticlesController,
	postArticleController,
	deleteArticleController,
	putArticleController,
	getArticleInfoController,
} from "./controllers/articles.controller.js";
import { getInvoiceController } from "./controllers/invoices.controller.js";
import {
	getAllSalesController,
	getArticleRecordsController,
	getArticleSalesController,
	getTodaysRecordsController,
	getVendorSalesController,
	postArticleRecordsController,
} from "./controllers/records.controller.js";
import {
	getAllSalesReportController,
	getArticleSalesReportController,
	getVendorSalesReportController,
	getWeeklyBillReportController,
} from "./controllers/reports.controller.js";
import {
	addDistrictController,
	addDriverController,
	deleteCalendarEntryController,
	deleteDistrictController,
	deleteDriverController,
	getCalendarEditController,
	getCalendarViewController,
	getDistrictsCalendarController,
	getDriversController,
	getScheduleExcelController,
	updateCalendarController,
	updateCalendarEntryController,
	updateDistrictCalendarController,
	updateDistrictController,
	updateDriverController,
} from "./controllers/schedule.controller.js";
import {
	getSettingsController,
	settingsLoginController,
	updateSettingsController,
} from "./controllers/settings.controller.js";
import {
	createOrUpdateVendorController,
	deleteVendorController,
	getDashboardVendorsController,
	getIncludedArticlesController,
	getVendorFullController,
	getVendorsController,
	postVendorController,
	putVendorController,
} from "./controllers/vendors.controller.js";

import logger from "./logger.js";

function routes(app: Express) {
	logger.info("Creating routes");

	app.route("/auth/main/articles").get(getArticlesController).post(postArticleController).put(putArticleController);

	app.route("/auth/main/articles/:id").delete(deleteArticleController);

	app.route("/auth/main/articles/sales").get(getArticleSalesController);

	app.route("/auth/main/articles/info").get(getArticleInfoController);

	app.route("/auth/main/vendors").get(getVendorsController).post(postVendorController).put(putVendorController);

	app.route("/auth/main/vendors/:id")
		.get(getVendorFullController)
		.post(createOrUpdateVendorController)
		.delete(deleteVendorController);

	app.route("/auth/main/vendors/:id/sales").get(getVendorSalesController);

	app.route("/auth/main/vendors/:id/includedArticles").get(getIncludedArticlesController);

	app.route("/auth/main/records/:id").get(getArticleRecordsController).post(postArticleRecordsController);

	app.route("/auth/main/records/:vendorId/today").get(getTodaysRecordsController);

	app.route("/auth/main/dashboard/allSales").get(getAllSalesController);
	app.route("/auth/main/dashboard/vendors").get(getDashboardVendorsController);

	app.route("/auth/main/calendar/view")
		.get(getCalendarViewController)
		.post(updateCalendarEntryController)
		.delete(deleteCalendarEntryController);

	app.route("/auth/calendar/view/excel").get(getScheduleExcelController);

	app.route("/auth/calendar/edit").get(getCalendarEditController).post(updateCalendarController);

	app.route("/auth/calendar/drivers").get(getDriversController).post(addDriverController).put(updateDriverController);

	app.route("/auth/calendar/drivers/:id").delete(deleteDriverController);

	app.route("/auth/calendar/districts")
		.get(getDistrictsCalendarController)
		.post(addDistrictController)
		.put(updateDistrictCalendarController)
		.delete(deleteDistrictController);

	app.route("/auth/calendar/districts/:id").put(updateDistrictController);

	app.get("/auth/main/reports/article/:id", getArticleSalesReportController);
	app.get("/auth/main/reports/vendor/:id", getVendorSalesReportController);
	app.get("/auth/main/reports/all", getAllSalesReportController);
	app.get("/auth/main/reports/weeklyBill", getWeeklyBillReportController);

	app.route("/auth/main/invoices/:id").get(getInvoiceController);

	app.route("/auth/accounts").get(getAccountsController);

	app.route("/auth/main/settings").get(getSettingsController).put(updateSettingsController);

	app.route("/auth/settings/login").get(settingsLoginController);

	app.route("/login").get(loginController);
}

export default routes;
