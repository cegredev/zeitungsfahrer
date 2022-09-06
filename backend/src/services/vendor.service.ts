import pool, { RouteReport } from "../database.js";
import { SellingDay, ArticleWeek } from "../models/vendor.model.js";
import dayjs from "dayjs";
import { Price } from "../models/article.model.js";
import { DATE_FORMAT } from "../consts.js";

export async function getPrices(end: Date): Promise<Map<number, Price[][]>> {
	const start = dayjs(end).subtract(6, "days").toDate();

	const response = await pool.execute(
		`SELECT start_date as startDate, weekday, article_id as articleId, mwst, purchase, sell, market_sell as marketSell, end_date as endDate
		FROM prices
		WHERE start_date <= ? AND (end_date > ? OR end_date IS NULL)
		ORDER BY start_date`,
		[dayjs(end).format(DATE_FORMAT), dayjs(start).format(DATE_FORMAT)]
	);

	const byArticleByWeekday = new Map<number, Price[][]>();

	// @ts-ignore
	for (const price of response[0]) {
		let byWeekday = byArticleByWeekday.get(price.articleId);

		if (byWeekday == null) {
			byWeekday = Array(7)
				.fill(null)
				.map(() => []);
			byArticleByWeekday.set(price.articleId, byWeekday);
		}

		byWeekday[price.weekday].push(price);
	}

	const startWeekday = (6 + start.getUTCDay()) % 7;

	for (const [key, week] of byArticleByWeekday.entries()) {
		byArticleByWeekday.set(
			key,
			week.map((prices, index) =>
				prices.length === 0
					? [
							{
								startDate: end,
								weekday: (startWeekday + index) % 7,
								articleId: key,
								mwst: 0,
								purchase: 0,
								sell: 0,
								marketSell: 0,
							},
					  ]
					: prices
			)
		);
	}

	return byArticleByWeekday;
}

export async function getVendorWeek(vendorId: number, end: Date): Promise<RouteReport> {
	const res = await pool.execute("SELECT * FROM vendors WHERE id=?", [vendorId]);
	// @ts-ignore
	const vendor = res[0][0];

	const start = dayjs(end).subtract(6, "days").toDate();

	const sellingDaysResponse = await pool.execute(
		`
SELECT selling_days.date, selling_days.remissions, selling_days.sales, articles.id as articleId, articles.name
FROM selling_days
INNER JOIN articles ON
	selling_days.article_id=articles.id
WHERE selling_days.vendor_id=? AND selling_days.date BETWEEN ? AND ?
ORDER BY articles.id`,
		[vendorId, start, end]
	);

	const millisInDay = 24 * 60 * 60 * 1_000,
		startMillis = start.getTime();

	// @ts-ignore
	const sellingDays: (SellingDay & { name: string })[] = sellingDaysResponse[0],
		daysByArticle = new Map<number, (SellingDay | null)[]>();

	// Sorts all days into an array matching their articleId at the index representing their weekday
	for (const day of sellingDays) {
		let articleDays = daysByArticle.get(day.articleId!);

		if (articleDays == null) {
			articleDays = Array(7).fill(null);
			daysByArticle.set(day.articleId!, articleDays);
		}

		// Math.round is here as a safety measure. Always make sure to set the time zone to "+00:00" in your MySQL server!
		const index = Math.round((day.date.getTime() - startMillis) / millisInDay);
		articleDays![index] = { ...day };
	}

	const allPrices: Map<number, Price[][]> = await getPrices(end);

	const weeks = new Map<number, ArticleWeek>(),
		startWeekday = (6 + start.getUTCDay()) % 7;

	for (const [articleId, prices] of allPrices.entries()) {
		let days = daysByArticle.get(articleId) || Array(7).fill(null);

		days = days.map((day, index) => {
			const possiblePrices = prices[(startWeekday + index) % 7];

			const date =
				day?.date ||
				dayjs(end)
					.subtract(6 - index, "days")
					.toDate();

			const price = possiblePrices.find((p) => p.startDate <= date && (p.endDate == null || p.endDate > date));

			return day == null
				? {
						date,
						remissions: 0,
						sales: 0,
						price,
				  }
				: { ...day, price };
		});

		const week = {
			id: articleId,
			// @ts-ignore
			name: (await pool.execute("SELECT name FROM articles WHERE id=?", [articleId]))[0][0].name,
			start,
			// @ts-ignore
			days,
		};

		weeks.set(articleId, week);
	}

	return {
		code: 200,
		body: { ...vendor, articleWeeks: [...weeks.values()] },
	};
}

export async function createOrUpdateSellingDays(
	vendorId: number,
	articleId: number,
	days: SellingDay[]
): Promise<RouteReport> {
	for (const day of days) {
		pool.execute(
			`INSERT INTO selling_days (date, article_id, vendor_id, remissions, sales) VALUES (?, ?, ?, ?, ?)
			ON DUPLICATE KEY
			UPDATE remissions=?, sales=?`,
			[
				dayjs(day.date).format("YYYY-MM-DD"),
				articleId,
				vendorId,
				day.remissions,
				day.sales,
				day.remissions,
				day.sales,
			]
		);
	}

	return {
		code: 200,
	};
}
