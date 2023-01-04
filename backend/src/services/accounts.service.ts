import { RouteReport } from "../database.js";

import jwt from "jsonwebtoken";
import { getEnvToken, poolExecute } from "../util.js";
import { LoginResult, LoginInfo, Role, Account } from "../models/accounts.model.js";
import { getIdFromCustomId, getVendorSimple, vendorAccountName } from "./vendors.service.js";

import { VENDOR_USERNAME_PREFIX } from "../models/vendors.model.js";

function generateAccessToken(payload: LoginInfo) {
	return jwt.sign(payload, getEnvToken(), { expiresIn: "12h" });
}

export async function login(name: string, password: string): Promise<LoginResult | undefined> {
	const response = await poolExecute<{ name: string; password: string; role: Role; id?: number }>(
		"SELECT name, password, role FROM accounts WHERE name=?",
		[name]
	);

	let dbData = response[0];
	if (response.length === 0) {
		const id = await getIdFromCustomId(name);
		if (id === undefined) return;

		const parsedName = vendorAccountName(id);

		const passRes = await poolExecute<{ password: string }>("SELECT password FROM accounts WHERE name=?", [
			parsedName,
		]);
		if (passRes.length === 0) return;

		dbData = {
			name: parsedName,
			password: passRes[0].password,
			role: "vendor",
			id,
		};
	}

	// FIXME
	if (dbData.password !== password) return;

	let home;
	switch (dbData.role) {
		case "main":
		case "dataEntry":
			home = "/dashboard";
			break;
		case "plan":
			home = "/schedule";
			break;
		case "accountAdmin":
			home = "/accounts";
			break;
		case "vendor":
			home = "/documents/" + dbData.id;
			break;
		default:
			home = "/badrole";
			break;
	}

	return {
		token: generateAccessToken({ username: dbData.name, role: dbData.role, vendorId: dbData.id }),
		home,
		username: dbData.name,
		role: dbData.role,
		vendorId: dbData.id,
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
	const response = await poolExecute<Account>("SELECT name, role FROM accounts ORDER BY role, name");

	const accounts = response.map(async (acc) => {
		if (acc.name.startsWith(VENDOR_USERNAME_PREFIX)) {
			const id = parseInt(acc.name.substring(VENDOR_USERNAME_PREFIX.length));
			const vendor = await getVendorSimple(id);

			acc = {
				...acc,
				prettyName: `${vendor.name} (${vendor.customId})`,
			};
		}

		return acc;
	});

	return {
		code: 200,
		body: await Promise.all(accounts),
	};
}

export async function createAccount(username: string, password: string, role: Role): Promise<RouteReport> {
	// FIXME AHHHH PASSWORDS

	await poolExecute("INSERT INTO accounts (name, password, role) VALUES (?, ?, ?)", [username, password, role]);

	return {
		code: 200,
		body: {
			password,
		},
	};
}

export async function changePassword(username: string, newPass: string): Promise<RouteReport> {
	// FIXME Passwords!!!!

	if (newPass.length < 8) return { code: 422 };

	poolExecute("UPDATE accounts SET password=? WHERE name=?", [newPass, username]);

	return { code: 200 };
}

export async function deleteAccount(username: string): Promise<void> {
	await poolExecute("DELETE FROM accounts WHERE name=?", [username]);
}
