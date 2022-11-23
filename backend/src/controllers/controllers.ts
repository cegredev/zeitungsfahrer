import { NextFunction, Request, Response } from "express";
import { RouteReport } from "../database.js";
import logger from "../logger.js";

import jwt from "jsonwebtoken";
import { getEnvToken } from "../util.js";

import path from "path";
import fs from "fs";

import ExcelJS from "exceljs";

export async function validateTokenHandler(req: Request, res: Response, next: NextFunction) {
	const token = req.headers["authorization"];

	if (token == null) return res.sendStatus(401);

	jwt.verify(token, getEnvToken(), (err, decoded) => {
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
		logger.info("Response: " + code);
	} catch (e) {
		console.error(e);
		logger.error(e);
		res.sendStatus(500);
	}
}

export async function downloadFileHandler(func: () => Promise<string>, res: Response, deleteAfter: boolean) {
	const file = await func();

	res.download(path.join(process.cwd(), file), (err) => {
		if (err) console.error(err);

		if (deleteAfter) {
			fs.unlink(file, (err) => {
				if (err) console.error(err);
			});
		}
	});
}

export async function downloadExcelHandler(excel: ExcelJS.Workbook, res: Response) {
	res.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
	excel.xlsx.write(res);
}
