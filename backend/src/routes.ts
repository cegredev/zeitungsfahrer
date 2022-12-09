import { Express, IRoute, RequestHandler } from "express";
import { allRoles } from "./consts.js";
import { getAccountsController, loginController } from "./controllers/accounts.controller.js";
import {
	getArticlesController,
	postArticleController,
	deleteArticleController,
	putArticleController,
	getArticleInfoController,
} from "./controllers/articles.controller.js";
import {
	createInvoiceController,
	deleteInvoiceController,
	getCustomInvoiceTextController,
	getInvoiceController,
	getInvoicesController,
	modifyTextController,
} from "./controllers/invoices.controller.js";
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
import { Role } from "./models/accounts.model.js";

interface FakeRoute {
	get: (handler: any) => FakeRoute;
	post: (handler: any) => FakeRoute;
	put: (handler: any) => FakeRoute;
	delete: (handler: any) => FakeRoute;
}

function guardedRoute(app: Express, roles: Role[], path: string): FakeRoute {
	const routes = roles.map((role) => app.route("/api/auth/" + role + "/" + path));

	return {
		get: function (this: FakeRoute, handler: any) {
			routes.forEach((route) => route.get(handler));
			return this;
		},
		post: function (this: FakeRoute, handler: any) {
			routes.forEach((route) => route.post(handler));
			return this;
		},
		put: function (this: FakeRoute, handler: any) {
			routes.forEach((route) => route.put(handler));
			return this;
		},
		delete: function (this: FakeRoute, handler: any) {
			routes.forEach((route) => route.delete(handler));
			return this;
		},
	};
}

function singleGuardedRoute(app: Express, role: Role, path: string) {
	return guardedRoute(app, [role], path);
}

function unguardedRoute(app: Express, path: string) {
	return guardedRoute(app, allRoles, path);
}

function routes(app: Express) {
	logger.info("Creating routes!");

	// Login
	app.route("/api/login").get(loginController);

	// Main
	singleGuardedRoute(app, "main", "articles")
		.get(getArticlesController)
		.post(postArticleController)
		.put(putArticleController);
	singleGuardedRoute(app, "main", "articles/:id").delete(deleteArticleController);
	singleGuardedRoute(app, "main", "articles/sales").get(getArticleSalesController);
	singleGuardedRoute(app, "main", "articles/info").get(getArticleInfoController);

	guardedRoute(app, ["main", "vendor"], "vendors")
		.get(getVendorsController)
		.post(postVendorController)
		.put(putVendorController);
	guardedRoute(app, ["main", "vendor"], "vendors/:id")
		.get(getVendorFullController)
		.post(createOrUpdateVendorController)
		.delete(deleteVendorController);
	guardedRoute(app, ["main", "vendor"], "vendors/:id/sales").get(getVendorSalesController);
	guardedRoute(app, ["main", "vendor"], "vendors/:id/includedArticles").get(getIncludedArticlesController);

	singleGuardedRoute(app, "main", "records/:id").get(getArticleRecordsController).post(postArticleRecordsController);
	singleGuardedRoute(app, "main", "records/:vendorId/today").get(getTodaysRecordsController);

	singleGuardedRoute(app, "main", "dashboard/allSales").get(getAllSalesController);
	singleGuardedRoute(app, "main", "dashboard/vendors").get(getDashboardVendorsController);

	singleGuardedRoute(app, "main", "reports/article/:id").get(getArticleSalesReportController);
	singleGuardedRoute(app, "main", "reports/vendor/:id").get(getVendorSalesReportController);
	singleGuardedRoute(app, "main", "reports/all").get(getAllSalesReportController);
	singleGuardedRoute(app, "main", "reports/weeklyBill").get(getWeeklyBillReportController);

	// Plan
	singleGuardedRoute(app, "plan", "calendar/view")
		.get(getCalendarViewController)
		.post(updateCalendarEntryController)
		.delete(deleteCalendarEntryController);
	singleGuardedRoute(app, "plan", "calendar/view/excel").get(getScheduleExcelController);
	singleGuardedRoute(app, "plan", "calendar/edit").get(getCalendarEditController).post(updateCalendarController);
	singleGuardedRoute(app, "plan", "calendar/drivers")
		.get(getDriversController)
		.post(addDriverController)
		.put(updateDriverController);
	singleGuardedRoute(app, "plan", "calendar/drivers/:id").delete(deleteDriverController);
	singleGuardedRoute(app, "plan", "calendar/districts")
		.get(getDistrictsCalendarController)
		.post(addDistrictController)
		.put(updateDistrictCalendarController)
		.delete(deleteDistrictController);
	singleGuardedRoute(app, "plan", "calendar/districts/:id").put(updateDistrictController);

	// Accounts
	singleGuardedRoute(app, "accountAdmin", "accounts").get(getAccountsController);

	// Invoices
	singleGuardedRoute(app, "main", "invoices/:id").delete(deleteInvoiceController).post(createInvoiceController);
	singleGuardedRoute(app, "main", "invoices/modify").get(getCustomInvoiceTextController).put(modifyTextController);
	guardedRoute(app, ["main", "vendor"], "invoices/:id").get(getInvoicesController);
	guardedRoute(app, ["main", "vendor"], "invoices/download/:id").get(getInvoiceController);

	// Settings
	unguardedRoute(app, "settings").get(getSettingsController);
	singleGuardedRoute(app, "main", "settings").put(updateSettingsController);
	singleGuardedRoute(app, "main", "settings/login").get(settingsLoginController);
}

export default routes;
