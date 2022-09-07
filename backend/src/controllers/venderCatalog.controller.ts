import { Request, Response } from "express";
import { getVendorCatalog } from "../services/vendorCatalog.service.js";

import { handler } from "./controllers.js";

export async function getVendorCatalogController(req: Request<{ id: number }>, res: Response) {
	await handler(async () => await getVendorCatalog(req.params.id), res);
}
