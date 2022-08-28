import { Request, Response } from "express";
import { VendorWeek } from "../models/vendor.model.js";
import { getVendorWeek } from "../services/vendor.service.js";
import { handler } from "./controllers.js";

export async function getVendorWeekController(
	req: Request<{ id: number }, any, any, { end: Date }>,
	res: Response<VendorWeek>
) {
	handler(async () => await getVendorWeek(req.params.id, req.query.end), res);
}
