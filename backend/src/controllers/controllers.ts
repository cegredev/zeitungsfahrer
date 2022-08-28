import { Response } from "express";
import { RouteReport } from "../database.js";
import logger from "../logger.js";

export async function handler(func: () => Promise<RouteReport>, res: Response) {
	try {
		const { code, body } = await func();
		res.status(code).send(body);
		logger.info("Reponse: " + code);
	} catch (e) {
		console.error(e);
		logger.error(e);
		res.sendStatus(500);
	}
}
