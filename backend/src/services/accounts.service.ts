import { RouteReport } from "../database.js";

import jwt from "jsonwebtoken";
import { getEnvToken, poolExecute } from "../util.js";
import { LoginResult, Role } from "../models/accounts.model.js";

function generateAccessToken(name: string, role: Role) {
	return jwt.sign({ username: name, role }, getEnvToken(), { expiresIn: "12h" });
}

export async function login(name: string, password: string): Promise<LoginResult | undefined> {
	const response = await poolExecute<{ name: string; password: string; role: Role }>(
		"SELECT name, password, role FROM accounts WHERE name=?",
		[name]
	);

	if (response.length === 0) return;

	const data = response[0];

	// FIXME
	if (data.password !== password) return;

	let path;
	switch (data.role) {
		case "main":
			path = "/dashboard";
			break;
		case "plan":
			path = "/schedule";
			break;
		case "accountAdmin":
			path = "/accounts";
			break;
		case "vendor":
			const res = await poolExecute<{ id: number }>("SELECT id FROM vendors WHERE custom_id=?", [data.name]);
			path = "/invoices/" + res[0].id;
			break;
		default:
			path = "/badrole";
			break;
	}

	return {
		token: generateAccessToken(name, data.role),
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
