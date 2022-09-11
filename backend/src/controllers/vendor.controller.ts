import { Request, Response } from "express";
import { SellingDay, VendorWeek } from "../models/vendor.model.js";
import { createOrUpdateSellingDays, getVendorWeek } from "../services/vendor.service.js";
import { getVendorCatalog } from "../services/vendorCatalog.service.js";
import { getVendorFull } from "../services/vendors.service.js";
import { handler } from "./controllers.js";

export async function getVendorWeekController(
	req: Request<{ id: number }, any, any, { end: Date }>,
	res: Response<VendorWeek>
) {
	handler(async () => await getVendorWeek(req.params.id, new Date(req.query.end)), res);
}

export async function getVendorFullController(
	req: Request<{ id: number }, any, any, { catalogOnly: "false" | "true" }>,
	res: Response<VendorWeek>
) {
	if (req.query.catalogOnly === "true") {
		handler(async () => ({ code: 200, body: await getVendorCatalog(req.params.id) }), res);
	} else {
		handler(async () => await getVendorFull(req.params.id), res);
	}
}

export async function postSellingDaysController(
	req: Request<{ id: number }, any, { articleId: number; days: SellingDay[] }>,
	res: Response
) {
	handler(async () => await createOrUpdateSellingDays(req.params.id, req.body.articleId, req.body.days), res);
}
