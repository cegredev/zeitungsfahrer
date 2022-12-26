import { Request, Response } from "express";
import { getAccounts, loginRoute } from "../services/accounts.service.js";
import { handler } from "./controllers.js";

export async function getAccountsController(req: Request, res: Response) {
	await handler(getAccounts, res);
}

export async function loginController(req: Request<any, any, { name: string; password: string }>, res: Response) {
	await handler(async () => await loginRoute(req.body.name, req.body.password), res);
}
