import { Request, Response } from "express";
import { getAccounts, loginRoute } from "../services/accounts.service.js";
import { handler } from "./controllers.js";

export async function getAccountsController(req: Request, res: Response) {
	await handler(getAccounts, res);
}

export async function loginController(
	req: Request<any, any, any, { name: string; password: string; rememberMe: boolean }>,
	res: Response
) {
	await handler(async () => await loginRoute(req.query.name, req.query.password, req.query.rememberMe), res);
}
