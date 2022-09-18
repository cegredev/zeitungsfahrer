import { Request, Response } from "express";
import { getAccounts } from "../services/accounts.service.js";
import { handler } from "./controllers.js";

export async function getAccountsController(req: Request, res: Response) {
	await handler(getAccounts, res);
}
