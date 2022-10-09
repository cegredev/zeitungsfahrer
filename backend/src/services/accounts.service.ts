import { RouteReport } from "../database.js";

import jwt from "jsonwebtoken";
import { getEnvToken, poolExecute } from "../util.js";

function generateAccessToken(name: string) {
	return jwt.sign({ username: name }, getEnvToken(), { expiresIn: "12h" });
}

export async function validatePassword(name: string, password: string): Promise<boolean> {
	const response = await poolExecute<{ name: string; password: string; role: number }>(
		"SELECT name, password, role FROM accounts WHERE name=?",
		[name]
	);

	// FIXME
	return response[0].password === password;
}

async function login(name: string, password: string) {
	if (!(await validatePassword(name, password))) return;

	return generateAccessToken(name);
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
	const response = await poolExecute("SELECT name, role FROM accounts");

	return {
		code: 200,
		body: [...response[0]],
	};
}
