import { Request, Response } from "express";
import { getVendorWeek } from "../services/vendor.service.js";
import { handler } from "./controllers.js";

export async function getVendorWeekController(req: Request<{ id: number }, any, any, { end: Date }>, res: Response) {
	handler(async () => await getVendorWeek(req.params.id, req.query.end), res);
}
