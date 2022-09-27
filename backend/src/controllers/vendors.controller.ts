import { Request, Response } from "express";
import { VendorRecords } from "../models/records.model.js";
import { Vendor } from "../models/vendors.model.js";
import {
	createOrUpdateVendorCatalog,
	createVendor,
	deleteVendor,
	getVendorCatalogRoute,
	getVendorFullRoute,
	getVendors,
	getVendorsSimple,
	updateVendor,
} from "../services/vendors.service.js";
import { handler } from "./controllers.js";

export async function getVendorsController(
	req: Request<any, any, any, { simple: string; includeInactive: string }>,
	res: Response
) {
	const simple = req.query.simple === "true";
	if (simple) return await handler(async () => ({ code: 200, body: await getVendorsSimple() }), res);

	const includeInactive = req.query.includeInactive === "true";
	await handler(async () => ({ code: 200, body: await getVendors(includeInactive) }), res);
}

export async function postVendorController(req: Request<any, any, Vendor>, res: Response) {
	await handler(async () => await createVendor(req.body), res);
}

export async function putVendorController(req: Request<any, any, Vendor>, res: Response) {
	await handler(async () => await updateVendor(req.body), res);
}

export async function deleteVendorController(req: Request<any, any, { id: number }>, res: Response) {
	await handler(async () => await deleteVendor(req.body.id), res);
}

export async function getVendorFullController(
	req: Request<{ id: number }, any, any, { catalogOnly: "false" | "true" }>,
	res: Response<VendorRecords>
) {
	if (req.query.catalogOnly === "true") {
		await handler(async () => await getVendorCatalogRoute(req.params.id), res);
	} else {
		await handler(async () => await getVendorFullRoute(req.params.id), res);
	}
}

export async function createOrUpdateVendorController(req: Request<Vendor>, res: Response) {
	await handler(async () => createOrUpdateVendorCatalog(req.body), res);
}
