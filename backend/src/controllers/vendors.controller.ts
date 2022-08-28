import { Request, Response } from "express";
import { Vendor } from "../models/vendors.model.js";
import { createVendor, deleteVendor, getVendors, updateVendor } from "../services/vendors.service.js";
import { handler } from "./controllers.js";

export async function getVendorsController(req: Request, res: Response) {
	await handler(getVendors, res);
}

export async function postVendorController(req: Request<any, any, Vendor>, res: Response) {
	const { name } = req.body;

	await handler(async () => await createVendor(name), res);
}

export async function putVendorController(req: Request<any, any, Vendor>, res: Response) {
	await handler(async () => await updateVendor(req.body), res);
}

export async function deleteVendorController(req: Request<any, any, { id: number }>, res: Response) {
	await handler(async () => await deleteVendor(req.body.id), res);
}
