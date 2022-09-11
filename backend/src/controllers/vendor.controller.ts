import { Request, Response } from "express";
import { ArticleRecords, VendorRecords } from "../models/vendor.model.js";
import { createOrUpdateArticleRecords, getVendorRecordsRoute } from "../services/vendor.service.js";
import { getVendorCatalogRoute } from "../services/vendorCatalog.service.js";
import { getVendorFullRoute } from "../services/vendors.service.js";
import { handler } from "./controllers.js";

export async function getVendorWeekController(
	req: Request<{ id: number }, any, any, { end: Date }>,
	res: Response<VendorRecords>
) {
	handler(async () => await getVendorRecordsRoute(req.params.id, new Date(req.query.end)), res);
}

export async function getVendorFullController(
	req: Request<{ id: number }, any, any, { catalogOnly: "false" | "true" }>,
	res: Response<VendorRecords>
) {
	if (req.query.catalogOnly === "true") {
		handler(async () => await getVendorCatalogRoute(req.params.id), res);
	} else {
		handler(async () => await getVendorFullRoute(req.params.id), res);
	}
}

export async function postArticleRecordsController(req: Request<{ id: number }, any, ArticleRecords>, res: Response) {
	handler(async () => await createOrUpdateArticleRecords(req.params.id, req.body), res);
}
