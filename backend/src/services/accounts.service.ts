import { RouteReport } from "../database.js";

import jwt from "jsonwebtoken";
import { getEnvToken, poolExecute } from "../util.js";
import { LoginResult, Role } from "../models/accounts.model.js";

function generateAccessToken(name: string, role: Role, vendorId?: number) {
	return jwt.sign({ username: name, role, vendorId }, getEnvToken(), { expiresIn: "12h" });
}

export async function login(name: string, password: string): Promise<LoginResult | undefined> {
	const response = await poolExecute<{ name: string; password: string; role: Role; id?: number }>(
		"SELECT name, password, role FROM accounts WHERE name=?",
		[name]
	);

	let data = response[0];
	if (response.length === 0) {
		const idRes = await poolExecute<{ id: number }>("SELECT id FROM vendors WHERE custom_id=?", [name]);
		if (idRes.length === 0) return;

		const id = idRes[0].id;
		const parsedName = "vendor:" + id;

		const passRes = await poolExecute<{ password: string }>("SELECT password FROM accounts WHERE name=?", [
			parsedName,
		]);
		if (passRes.length === 0) return;

		data = {
			name: parsedName,
			password: passRes[0].password,
			role: "vendor",
			id,
		};
	}

	// FIXME
	if (data.password !== password) return;

	let home;
	switch (data.role) {
		case "main":
			home = "/dashboard";
			break;
		case "plan":
			home = "/schedule";
			break;
		case "accountAdmin":
			home = "/accounts";
			break;
		case "vendor":
			home = "/invoices/" + data.id;
			break;
		default:
			home = "/badrole";
			break;
	}

	return {
		token: generateAccessToken(name, data.role, data.id),
		home,
		role: data.role,
		vendorId: data.id,
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
