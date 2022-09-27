import { NextFunction, Request, Response } from "express";
import { RouteReport } from "../database.js";
import logger from "../logger.js";

import jwt from "jsonwebtoken";
import { getEnvToken } from "../util.js";

export async function validateTokenHandler(req: Request, res: Response, next: NextFunction) {
	const token = req.headers["authorization"];

	if (token == null) return res.sendStatus(401);

	jwt.verify(token, getEnvToken(), (err, decoded) => {
		console.error(err);

		if (err) return res.sendStatus(403);

		// @ts-ignore
		req.tokenData = decoded;
		next();
	});
}

export async function handler(func: () => Promise<RouteReport>, res: Response) {
	try {
		const { code, body } = await func();
		res.status(code).send(JSON.stringify(body));
		logger.info("Reponse: " + code);
	} catch (e) {
		console.error(e);
		logger.error(e);
		res.sendStatus(500);
	}
}
