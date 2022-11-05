import { RouteReport } from "../database.js";

import jwt from "jsonwebtoken";
import { getEnvToken, poolExecute } from "../util.js";
import { LoginResult } from "../models/accounts.model.js";

function generateAccessToken(name: string) {
	return jwt.sign({ username: name }, getEnvToken(), { expiresIn: "12h" });
}

export async function login(name: string, password: string): Promise<LoginResult | undefined> {
	const response = await poolExecute<{ name: string; password: string; role: number }>(
		"SELECT name, password, role FROM accounts WHERE name=?",
		[name]
	);

	if (response.length === 0) return;

	const data = response[0];

	// FIXME
	if (data.password !== password) return;

	let path;
	switch (data.role) {
		case 1:
			path = "/dashboard";
			break;
		case 2:
			path = "/schedule";
			break;
		default:
			path = "/badrole";
			break;
	}

	return {
		token: generateAccessToken(name),
		path,
		role: data.role,
	};
}

export async function loginRoute(name: string, password: string): Promise<RouteReport> {
	const data = await login(name, password);

	return data === undefined
		? {
				code: 401,
				body: {},
		  }
		: {
				code: 200,
				body: data,
		  };
}

export async function getAccounts(): Promise<RouteReport> {
	const response = await poolExecute("SELECT name, role FROM accounts");

	return {
		code: 200,
		body: [...response[0]],
	};
}
