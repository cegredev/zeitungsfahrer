import { Request, Response } from "express";
import { Vendor } from "../models/vendors.model.js";
import { createOrUpdateVendorCatalog, getVendorCatalog } from "../services/vendorCatalog.service.js";

import { handler } from "./controllers.js";

export async function getVendorCatalogController(req: Request<{ id: number }>, res: Response) {
	await handler(async () => ({ code: 200, body: await getVendorCatalog(req.params.id) }), res);
}

export async function createOrUpdateVendorController(req: Request<Vendor>, res: Response) {
	await handler(async () => createOrUpdateVendorCatalog(req.body), res);
}
