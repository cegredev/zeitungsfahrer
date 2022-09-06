import { Vendor } from "../models/vendors.model.js";
import pool, { RouteReport } from "../database.js";
import logger from "../logger.js";

export async function getVendors(): Promise<RouteReport> {
	const result = await pool.execute(`SELECT id, name, address, zip_code as zipCode, city, weekday, supply FROM vendors
		INNER JOIN vendor_supplies ON id=vendor_id ORDER BY weekday`);

	const vendorSupplyMap = new Map<number, Vendor>();

	// @ts-ignore
	for (const { id, name, address, zipCode, city, weekday, supply } of result[0]) {
		let vendor = vendorSupplyMap.get(id);
		if (vendor == null) {
			vendor = { id, name, address, zipCode, city, supplies: [] };
			vendorSupplyMap.set(id, vendor);
		}

		vendor.supplies.push({ weekday, supply });
	}

	return {
		code: 200,
		body: [...vendorSupplyMap.values()],
	};
}

export async function createVendor(vendor: Vendor): Promise<RouteReport> {
	const result = await pool.execute(`INSERT INTO vendors (name, address, zip_code, city) VALUES (?, ?, ?, ?)`, [
		vendor.name,
		vendor.address,
		vendor.zipCode,
		vendor.city,
	]);

	// @ts-ignore
	const id: number = result[0].insertId;

	await pool.query(
		"INSERT INTO vendor_supplies (weekday, supply) VALUES " +
			vendor.supplies.map((supply, index) => `(${index}, ${supply.supply})`).join(",")
	);

	return {
		code: 200,
		body: { id },
	};
}

export async function updateVendor({ id, name, address, zipCode, city, supplies }: Vendor): Promise<RouteReport> {
	await pool.execute("UPDATE vendors SET name=?, address=?, zip_code=?, city=? WHERE id=?", [
		name,
		address,
		zipCode,
		city,
		id,
	]);

	for await (const supply of supplies) {
		await pool.execute("UPDATE vendor_supplies SET supply=? WHERE vendor_id=? AND weekday=?", [
			supply.supply,
			id,
			supply.weekday!,
		]);
	}

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
