import { Request, Response } from "express";
import { changePassword, getAccounts, loginRoute, login } from "../services/accounts.service.js";
import { getTokenData, handler } from "./controllers.js";

export async function getAccountsController(req: Request, res: Response) {
	await handler(getAccounts, res);
}

export async function loginController(req: Request<any, any, { name: string; password: string }>, res: Response) {
	await handler(async () => await loginRoute(req.body.name, req.body.password), res);
}

export async function changeOwnPasswordController(
	req: Request<any, any, { oldPassword: string; newPassword: string }>,
	res: Response
) {
	const { oldPassword, newPassword } = req.body;
	const username = getTokenData(req)?.username;

	if (username === undefined) return res.sendStatus(422);

	if ((await login(username, oldPassword)) === undefined) return res.sendStatus(403);

	handler(async () => await changePassword(username, newPassword), res);
}

export async function changeOtherPasswordController(
	req: Request<any, any, { username: string; password: string }>,
	res: Response
) {
	handler(async () => await changePassword(req.body.username, req.body.password), res);
}
