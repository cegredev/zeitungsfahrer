import { SimpleVendor, Vendor, VendorIncludedArticles } from "../models/vendors.model.js";
import pool, { RouteReport } from "../database.js";
import { VendorCatalog, VendorCatalogEntry } from "../models/vendors.model.js";
import { poolExecute } from "../util.js";
import { ArticleInfo } from "../models/articles.model.js";

export async function getVendors(includeInactive: boolean): Promise<Vendor[]> {
	const result = await pool.execute(
		`SELECT id, first_name as firstName, last_name as lastName, address, zip_code as zipCode,
				city, email, phone, tax_id as taxId, active, last_record_entry as lastRecordEntry
		 FROM vendors 
		 ${!includeInactive ? "WHERE active=1" : ""}
		 ORDER BY last_name`
	);

	// @ts-ignore
	const vendors: Vendor[] = result[0];

	return vendors;
}

export async function getVendorsSimple(): Promise<SimpleVendor[]> {
	const result = await pool.execute(
		`SELECT id, CONCAT(first_name, " ", last_name) as name, active FROM vendors ORDER BY last_name`
	);

	// @ts-ignore
	const vendors: SimpleVendor[] = result[0];

	// @ts-ignore
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
	const result = await pool.execute(
		"SELECT first_name as firstName, last_name as lastName, address, zip_code as zipCode, city, email, phone, tax_id as taxId, active FROM vendors WHERE id=?",
		[id]
	);

	// @ts-ignore
	return { id, ...result[0][0] };
}

export async function getVendorFull(id: number): Promise<Vendor> {
	const vendor = await getVendor(id);
	const catalog = await getVendorCatalog(id);
	return { ...vendor, catalog };
}

export async function getVendorFullRoute(id: number): Promise<RouteReport> {
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
