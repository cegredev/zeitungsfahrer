import { Vendor } from "../models/vendors.model.js";
import pool, { RouteReport } from "../database.js";

export async function getVendors(): Promise<RouteReport> {
	const conn = await pool.getConnection();
	const result = await conn.execute("SELECT id, name FROM vendors");

	console.log(result);

	return {
		code: 200,
		body: JSON.stringify(result[0]),
	};
}

export async function createVendor(name: string): Promise<RouteReport> {
	const conn = await pool.getConnection();
	const result = await conn.execute(`INSERT INTO vendors (name) VALUES (?)`, [name]);

	// @ts-ignore
	const id: number = result[0].insertId;

	return {
		code: 200,
		body: JSON.stringify({ id }),
	};
}

export async function updateVendor({ id, name }: Vendor): Promise<RouteReport> {
	const conn = await pool.getConnection();
	await conn.execute("UPDATE vendors SET name=? WHERE id=?", [name, id]);

	return {
		code: 200,
	};
}

export async function deleteVendor(id: number): Promise<RouteReport> {
	const conn = await pool.getConnection();
	await conn.execute("DELETE FROM vendors WHERE id=?", [id]);

	return {
		code: 200,
	};
}
