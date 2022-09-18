import { Request, Response } from "express";
import { Settings } from "../models/settings.model.js";
import { getSettings, updateSettingsRoute } from "../services/settings.service.js";
import { handler } from "./controllers.js";

export async function getSettingsController(req: Request, res: Response) {
	await handler(getSettings, res);
}

export async function updateSettingsController(req: Request<any, any, Settings>, res: Response) {
	await handler(async () => await updateSettingsRoute(req.body), res);
}
