import pool, { RouteReport } from "../database.js";

export async function getAccounts(): Promise<RouteReport> {
	const response = await pool.execute("SELECT name, role FROM accounts");

	return {
		code: 200,
		// @ts-ignore
		body: [...response[0]],
	};
}
