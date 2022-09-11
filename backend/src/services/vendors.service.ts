import { Vendor } from "../models/vendors.model.js";
import pool, { RouteReport } from "../database.js";
import logger from "../logger.js";
import { createOrUpdateVendorCatalog, getVendorCatalog } from "./vendorCatalog.service.js";

export async function getVendors(): Promise<RouteReport> {
	const result = await pool.execute(
		`SELECT id, first_name as firstName, last_name as lastName, address, zip_code as zipCode, city, email, phone, tax_id as taxId, active FROM vendors ORDER BY last_name`
	);

	return {
		code: 200,
		body: result[0],
	};
}

export async function getVendor(id: number): Promise<Vendor> {
	const result = await pool.execute(
		"SELECT first_name as firstName, last_name as lastName, address, zip_code as zipCode, city, email, phone, tax_id as taxId, active FROM vendors WHERE id=?",
		[id]
	);

	// @ts-ignore
	return { id, ...result[0][0] };
}

export async function getVendorFull(id: number): Promise<RouteReport> {
	const vendor = await getVendor(id);
	const catalog = await getVendorCatalog(id);
	return {
		code: 200,
		body: { ...vendor, catalog },
	};
}

export async function createVendor(vendor: Vendor): Promise<RouteReport> {
	const response = await pool.execute(
		`INSERT INTO vendors (first_name, last_name, address, zip_code, city, email, phone, tax_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			vendor.firstName,
			vendor.lastName,
			vendor.address,
			vendor.zipCode,
			vendor.city,
			vendor.email,
			vendor.phone,
			vendor.taxId,
		]
	);

	// @ts-ignore
	const id: number = response[0].insertId;

	return {
		code: 200,
		body: { id },
	};
}

export async function updateVendor({
	id,
	firstName,
	lastName,
	address,
	zipCode,
	city,
	email,
	phone,
	active,
	taxId,
}: // catalog,
Vendor): Promise<RouteReport> {
	await pool.execute(
		"UPDATE vendors SET first_name=?, last_name=?, address=?, zip_code=?, city=?, email=?, phone=?, tax_id=?, active=? WHERE id=?",
		[firstName, lastName, address, zipCode, city, email, phone, taxId, active, id]
	);

	// if (catalog != null) {
	// 	for await (const entry of catalog.entries) {
	// 		await pool.execute("UPDATE vendor_catalog SET included=? WHERE vendor_id=? AND article_id=?", [
	// 			id,
	// 			entry.articleId,
	// 		]);

	// 		let i = 0;
	// 		for await (const supply of entry.supplies) {
	// 			await pool.execute(
	// 				"UPDATE vendor_supplies SET supply=? WHERE vendor_id=? AND article_id=? AND weekday=?",
	// 				[supply, id, entry.articleId, i]
	// 			);

	// 			i++;
	// 		}
	// 	}
	// }

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
