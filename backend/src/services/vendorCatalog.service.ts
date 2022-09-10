import pool, { RouteReport } from "../database.js";
import { VendorCatalog, VendorCatalogEntry } from "../models/vendorCatalog.model.js";

export async function getVendorCatalog(vendorId: number): Promise<VendorCatalog> {
	const response = await pool.execute(
		`SELECT articles.name, articles.id as articleId, vendor_supplies.weekday, vendor_supplies.supply, vendor_catalog.included FROM articles
        LEFT JOIN vendor_catalog ON articles.id=vendor_catalog.article_id AND vendor_catalog.vendor_id=?
        LEFT JOIN vendor_supplies ON vendor_supplies.article_id=articles.id AND vendor_supplies.vendor_id=? `,
		[vendorId, vendorId]
	);

	console.log("response, ", response[0]);

	const map = new Map<number, VendorCatalogEntry>();
	// @ts-ignore
	for (const { name, articleId, weekday, supply, included } of response[0]) {
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

		// console.log(articleId, map.get(2)?.supplies);

		article.supplies![weekday] = supply;
	}

	// console.log(map.values());

	return { vendorId, entries: [...map.values()] };
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
