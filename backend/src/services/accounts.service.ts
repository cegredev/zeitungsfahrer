import pool, { RouteReport } from "../database.js";

import jwt from "jsonwebtoken";
import { getEnvToken } from "../util.js";
import { Response } from "express";

function generateAccessToken(name: string) {
	return jwt.sign({ username: name }, getEnvToken(), { expiresIn: "12h" });
}

async function validatePassword(name: string, password: string): Promise<boolean> {
	const response = await pool.execute("SELECT name, password, role FROM accounts WHERE name=?", [name]);

	// @ts-ignore
	const account: { name: string; password: string; role: number } = response[0][0];

	// FIXME
	return account.password === password;
}

async function login(name: string, password: string) {
	if (!(await validatePassword(name, password))) return;

	const token = generateAccessToken(name);

	return token;
}

export async function loginRoute(name: string, password: string): Promise<RouteReport> {
	const token = await login(name, password);

	return token === undefined
		? {
				code: 401,
				body: {},
		  }
		: {
				code: 200,
				body: { token },
		  };
}

export async function getAccounts(): Promise<RouteReport> {
	const response = await pool.execute("SELECT name, role FROM accounts");

	return {
		code: 200,
		// @ts-ignore
		body: [...response[0]],
	};
}
