import { Vendor } from "../models/vendors.model.js";
import pool, { RouteReport } from "../database.js";
import { ArticleSales, VendorWeek } from "../models/vendor.model.js";

function dateFormatter(date: Date): string {
	return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export async function getVendorWeek(vendorId: number, end: Date): Promise<RouteReport> {
	const start = new Date(end);
	start.setDate(start.getDate() - 7);

	const response = await pool.execute(
		"SELECT date, remissions, sales, article_id FROM selling_days WHERE vendor_id=? AND date > ? AND date <= ?",
		[vendorId, start, end]
	);

	const map = new Map<number, ArticleSales[]>();
	const millisInDay = 24 * 60 * 60 * 1_000,
		startMillis = start.getTime();

	// @ts-ignore
	for (const { date, remissions, sales, article_id: articleId } of response[0]) {
		let articleSales = map.get(articleId);
		if (articleSales == null) {
			articleSales = Array(7).fill({ remissions: 0, sales: 0 });
			map.set(articleId, articleSales);
		}

		// Math.round is here as a safety measure. Always make sure to set the time zone to "+00:00" in your MySQL server!
		const index = Math.round((date.getTime() - startMillis) / millisInDay - 1);
		articleSales[index] = { remissions, sales };
	}

	return {
		code: 200,
		body: JSON.stringify(Object.fromEntries(map.entries())),
	};
}
