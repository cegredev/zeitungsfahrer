import { Vendor } from "../models/vendors.model.js";
import pool, { RouteReport } from "../database.js";

export async function getVendors(): Promise<RouteReport> {
	const result = await pool.execute("SELECT id, name FROM vendors");

	return {
		code: 200,
		body: JSON.stringify(result[0]),
	};
}

export async function createVendor(name: string): Promise<RouteReport> {
	const result = await pool.execute(`INSERT INTO vendors (name) VALUES (?)`, [name]);

	// @ts-ignore
	const id: number = result[0].insertId;

	return {
		code: 200,
		body: JSON.stringify({ id }),
	};
}

export async function updateVendor({ id, name }: Vendor): Promise<RouteReport> {
	await pool.execute("UPDATE vendors SET name=? WHERE id=?", [name, id]);

	return {
		code: 200,
	};
}

export async function deleteVendor(id: number): Promise<RouteReport> {
	await pool.execute("DELETE FROM vendors WHERE id=?", [id]);

	return {
		code: 200,
	};
}
