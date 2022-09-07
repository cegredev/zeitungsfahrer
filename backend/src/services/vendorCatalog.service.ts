import pool, { RouteReport } from "../database.js";
import dayjs from "dayjs";
import { VendorCatalogEntry } from "../models/vendorCatalog.model.js";

export async function getVendorCatalog(vendorId: number): Promise<RouteReport> {
	const response = await pool.execute(
		`SELECT articles.name, articles.id as articleId, vendor_supplies.weekday, vendor_supplies.supply, vendor_article_catalog.included FROM vendor_article_catalog
        INNER JOIN articles ON vendor_article_catalog.article_id=articles.id
        INNER JOIN vendor_supplies ON vendor_supplies.vendor_id=?`,
		[vendorId]
	);

	const map = new Map<number, VendorCatalogEntry>();
	// @ts-ignore
	for (const { name, articleId, weekday, supply, included } of response[0]) {
		let article = map.get(articleId);
		if (article == null) {
			article = {
				articleName: name,
				articleId,
				included: included === 1,
				supplies: Array(7).fill(0),
			};
			map.set(articleId, article);
		}

		article.supplies![weekday] = supply;
	}

	return {
		code: 200,
		body: [...map.values()],
	};
}
