import { Request, Response } from "express";
import { Vendor } from "../models/vendors.model.js";
import {
	createOrUpdateVendorCatalog,
	createVendor,
	deleteVendor,
	getDashboardVendors,
	getIncludedArticleIds,
	getVendorCatalogRoute,
	getVendorFullRoute,
	getVendors,
	getVendorSimple,
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

export async function getDashboardVendorsController(req: Request, res: Response) {
	await handler(
		async () => ({
			code: 200,
			body: await getDashboardVendors(),
		}),
		res
	);
}

export async function getIncludedArticlesController(req: Request<{ id: string }>, res: Response) {
	await handler(async () => ({ code: 200, body: await getIncludedArticleIds(parseInt(req.params.id)) }), res);
}

export async function postVendorController(req: Request<any, any, Vendor>, res: Response) {
	await handler(async () => await createVendor(req.body), res);
}

export async function putVendorController(req: Request<any, any, Vendor>, res: Response) {
	await handler(async () => await updateVendor(req.body), res);
}

export async function deleteVendorController(req: Request<{ id: string }>, res: Response) {
	await handler(async () => await deleteVendor(parseInt(req.params.id)), res);
}

export async function getVendorFullController(
	req: Request<{ id: string }, any, any, { mode: "simple" | "full" | "catalog" }>,
	res: Response
) {
	switch (req.query.mode) {
		case "simple":
			return await handler(
				async () => ({
					code: 200,
					body: await getVendorSimple(parseInt(req.params.id)),
				}),
				res
			);
		case "full":
			return await handler(async () => await getVendorFullRoute(parseInt(req.params.id)), res);
		case "catalog":
			return await handler(async () => await getVendorCatalogRoute(parseInt(req.params.id)), res);
	}
}

export async function createOrUpdateVendorController(req: Request<Vendor>, res: Response) {
	await handler(async () => createOrUpdateVendorCatalog(req.body), res);
}
