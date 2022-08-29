import { Vendor } from "../models/vendors.model.js";
import pool, { RouteReport } from "../database.js";
import { SellingDay, ArticleWeek } from "../models/vendor.model.js";

function dateFormatter(date: Date): string {
	return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export async function getVendorWeek(vendorId: number, end: Date): Promise<RouteReport> {
	const res = await pool.execute("SELECT * FROM vendors WHERE id=?", [vendorId]);
	// @ts-ignore
	const vendor = res[0][0];

	const start = new Date(end);
	start.setDate(start.getDate() - 6);

	const response = await pool.execute(
		`SELECT selling_days.date, selling_days.remissions, selling_days.sales, selling_days.mwst, articles.id, articles.name
        FROM selling_days
        INNER JOIN articles ON selling_days.article_id=articles.id
        WHERE selling_days.vendor_id=? AND selling_days.date >= ? AND selling_days.date <= ?
		ORDER BY articles.id`,
		[vendorId, start, end]
	);

	const map = new Map<number, ArticleWeek>();
	const millisInDay = 24 * 60 * 60 * 1_000,
		startMillis = start.getTime();

	// @ts-ignore
	for (const { date, remissions, sales, mwst, id, name } of response[0]) {
		let articleWeek = map.get(id);
		if (articleWeek == null) {
			articleWeek = {
				id,
				name,
				start,
				days: Array(7).fill({ remissions: 0, sales: 0 }),
			};
			map.set(id, articleWeek);
		}

		// Math.round is here as a safety measure. Always make sure to set the time zone to "+00:00" in your MySQL server!
		const index = Math.round((date.getTime() - startMillis) / millisInDay - 1);
		articleWeek.days[index] = { remissions, sales, mwst };
	}

	return {
		code: 200,
		body: JSON.stringify({ ...vendor, articleWeeks: [...map.values()] }),
	};
}
