import { Request, Response } from "express";
import { Account } from "../models/accounts.model.js";
import {
	changePassword,
	getAccounts,
	loginRoute,
	login,
	createAccount,
	deleteAccount,
} from "../services/accounts.service.js";
import { getTokenData, handler } from "./controllers.js";

export async function getAccountsController(req: Request, res: Response) {
	await handler(getAccounts, res);
}

export async function createAccountController(req: Request<any, any, Account>, res: Response) {
	const account = req.body;
	handler(
		async () => ({
			code: 200,
			body: await createAccount(account.name, account.password!, account.role),
		}),
		res
	);
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

export async function deleteAccountController(req: Request<any, any, any, { name: string }>, res: Response) {
	handler(async () => ({ code: 200, body: await deleteAccount(req.query.name) }), res);
}
