import { DashboardVendor, SimpleVendor, Vendor, VendorIncludedArticles } from "../models/vendors.model.js";
import pool, { RouteReport } from "../database.js";
import { VendorCatalog, VendorCatalogEntry } from "../models/vendors.model.js";
import { poolExecute } from "../util.js";
import { ArticleInfo } from "../models/articles.model.js";
import { DATE_FORMAT } from "../consts.js";
import dayjs from "dayjs";

export async function getVendors(includeInactive: boolean): Promise<Vendor[]> {
	return await poolExecute<Vendor>(
		`SELECT id, first_name as firstName, last_name as lastName, address, zip_code as zipCode,
				city, email, phone, tax_id as taxId, active, custom_id as customId
		 FROM vendors 
		 ${!includeInactive ? "WHERE active=1" : ""}
		 ORDER BY last_name`
	);
}

export async function getDashboardVendors() {
	const vendors = (await getVendorsSimple()).filter((vendor) => vendor.active);

	const vendorsChecked = new Set(
		(
			await poolExecute<{ id: number }>(
				`SELECT id FROM vendors
			LEFT JOIN records ON vendors.id=records.vendor_id
			WHERE records.date=?
	`,
				[dayjs(new Date()).format(DATE_FORMAT)]
			)
		).map((vendor) => vendor.id)
	);

	return vendors.map((vendor) => ({
		...vendor,
		checked: vendorsChecked.has(vendor.id),
	}));
}

export async function getVendorsSimple(): Promise<SimpleVendor[]> {
	const vendors = await poolExecute<{ id: number; name: string; active: number }>(
		`SELECT id, CONCAT(first_name, " ", last_name) as name, active FROM vendors ORDER BY last_name`
	);

	return vendors.map((vendor) => ({ ...vendor, active: vendor.active === 1 }));
}

export async function getIncludedArticles(vendorId: number): Promise<ArticleInfo[]> {
	return await poolExecute<ArticleInfo>(
		"SELECT article_id as id, name FROM vendor_catalog INNER JOIN articles ON article_id=id WHERE vendor_id=? AND included=1 ",
		[vendorId]
	);
}

export async function getIncludedArticleIds(vendorId: number): Promise<VendorIncludedArticles> {
	const articleIds = (
		await poolExecute<{ id: number }>(
			"SELECT article_id as id FROM vendor_catalog WHERE vendor_id=? AND included=1",
			[vendorId]
		)
	).map((e) => e.id);

	const name = (
		await poolExecute<{ name: string }>(
			"SELECT CONCAT(first_name, ' ', last_name) as name FROM vendors WHERE id=?",
			[vendorId]
		)
	)[0].name;

	return { name, articleIds };
}

export async function getVendor(id: number): Promise<Vendor> {
	const result = await poolExecute<Vendor>(
		"SELECT id, first_name as firstName, last_name as lastName, address, zip_code as zipCode, city, email, phone, tax_id as taxId, active, custom_id as customId FROM vendors WHERE id=?",
		[id]
	);

	return result[0];
}

export async function getVendorFull(id: number): Promise<Vendor> {
	const vendor = await getVendor(id);
	const catalog = await getVendorCatalog(id);
	return { ...vendor, catalog };
}

export async function getVendorFullRoute(id: number): Promise<RouteReport> {
	return {
		code: 200,
		body: await getVendorFull(id),
	};
}

export async function createVendor(vendor: Vendor): Promise<RouteReport> {
	if ((await poolExecute("SELECT 1 FROM vendors WHERE custom_id=?", [vendor.customId])).length >= 1) {
		return {
			code: 400,
			body: { userMessage: "Es gibt bereits einen Händler mit dieser Kundennummer." },
		};
	}

	const response = await pool.execute(
		`INSERT INTO vendors (first_name, last_name, address, zip_code, city, email, phone, tax_id, custom_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			vendor.firstName,
			vendor.lastName,
			vendor.address,
			vendor.zipCode,
			vendor.city,
			vendor.email,
			vendor.phone,
			vendor.taxId,
			vendor.customId,
		]
	);

	// @ts-ignore
	const id: number = response[0].insertId;

	return {
		code: 200,
		body: { id },
	};
}

export async function updateVendor(vendor: Vendor): Promise<RouteReport> {
	if (
		(await poolExecute("SELECT 1 FROM vendors WHERE custom_id=? AND id!=?", [vendor.customId, vendor.id])).length >=
		1
	) {
		return {
			code: 400,
			body: { userMessage: "Es gibt bereits einen Händler mit dieser Kundennummer." },
		};
	}

	await pool.execute(
		"UPDATE vendors SET first_name=?, last_name=?, address=?, zip_code=?, city=?, email=?, phone=?, tax_id=?, active=?, custom_id=? WHERE id=?",
		[
			vendor.firstName,
			vendor.lastName,
			vendor.address,
			vendor.zipCode,
			vendor.city,
			vendor.email,
			vendor.phone,
			vendor.taxId,
			vendor.active,
			vendor.customId,
			vendor.id,
		]
	);

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

export async function getVendorCatalog(vendorId: number, articleId?: number): Promise<VendorCatalog> {
	const response = await poolExecute(
		`SELECT articles.name, articles.id as articleId, vendor_supplies.weekday, vendor_supplies.supply, vendor_catalog.included FROM articles
        LEFT JOIN vendor_catalog ON articles.id=vendor_catalog.article_id AND vendor_catalog.vendor_id=?
        LEFT JOIN vendor_supplies ON vendor_supplies.article_id=articles.id AND vendor_supplies.vendor_id=?
		${articleId ? "WHERE articles.id=" + articleId : ""}`,
		[vendorId, vendorId]
	);

	const map = new Map<number, VendorCatalogEntry>();
	for (const { name, articleId, weekday, supply, included } of response) {
		let article = map.get(articleId);
		if (article == null) {
			article = {
				articleName: name,
				articleId,
				included: included === 1,
				supplies: Array(7)
					.fill(null)
					.map((_) => 0),
			};
			map.set(articleId, article);
		}

		article.supplies![weekday] = supply;
	}

	return { vendorId, entries: [...map.values()] };
}

export async function getVendorCatalogRoute(vendorId: number): Promise<RouteReport> {
	return {
		code: 200,
		body: await getVendorCatalog(vendorId),
	};
}

export async function createOrUpdateVendorCatalog(catalog: VendorCatalog): Promise<RouteReport> {
	for (const entry of catalog.entries) {
		const included = entry.included ? 1 : 0;

		await pool.execute(
			`INSERT INTO vendor_catalog (vendor_id, article_id, included)
			 VALUES (?, ?, ?) ON DUPLICATE KEY
			 UPDATE included=?`,
			[catalog.vendorId, entry.articleId, included, included]
		);

		let weekday = 0;
		for (const supply of entry.supplies) {
			pool.execute(
				`INSERT INTO vendor_supplies (vendor_id, article_id, weekday, supply)
						  VALUES (?, ?, ?, ?) ON DUPLICATE KEY
						  UPDATE supply=?`,
				[catalog.vendorId, entry.articleId, weekday, supply, supply]
			);

			weekday++;
		}
	}

	return { code: 200 };
}
