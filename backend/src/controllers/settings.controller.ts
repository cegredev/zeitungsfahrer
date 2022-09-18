import { Request, Response } from "express";
import { getSettings } from "../services/settings.service.js";
import { handler } from "./controllers.js";

export async function getSettingsController(req: Request, res: Response) {
	await handler(getSettings, res);
}
