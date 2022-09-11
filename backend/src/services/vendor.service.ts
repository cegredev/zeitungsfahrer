import pool, { RouteReport } from "../database.js";
import { Record, ArticleRecords, VendorRecords } from "../models/vendor.model.js";
import dayjs from "dayjs";
import { Price } from "../models/article.model.js";
import { DATE_FORMAT } from "../consts.js";
import { getVendorFull } from "./vendors.service.js";

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

export async function getVendorRecords(vendorId: number, end: Date): Promise<VendorRecords> {
	const numOfDays = 7;

	const start = dayjs(end)
		.subtract(numOfDays - 1, "days")
		.toDate();

	const vendor = await getVendorFull(vendorId);

	const millisInDay = 24 * 60 * 60 * 1_000,
		startMillis = start.getTime(),
		startWeekday = (6 + start.getUTCDay()) % 7;

	const includedArticleRecords: Map<number, ArticleRecords> = new Map();
	for (const entry of vendor.catalog!.entries) {
		if (entry.included) {
			const response = await pool.execute(
				`
				SELECT records.date, supply, remissions
				FROM records
				WHERE records.vendor_id=? AND records.article_id=? AND records.date BETWEEN ? AND ?
				ORDER BY records.article_id
			`,
				[vendorId, entry.articleId, start, end]
			);

			const catalogEntry = vendor.catalog!.entries.find((e) => e.articleId === entry.articleId)!;

			const articleRecords = {
				id: entry.articleId,
				name: entry.articleName,
				start,
				records: Array(numOfDays)
					.fill(null)
					.map((_, index) => ({
						date: dayjs(start).add(index, "days").toDate(),
						supply: catalogEntry.supplies[(startWeekday + index) % 7],
						remissions: 0,
					})),
			};

			// @ts-ignore
			const records: Record[] = response[0];
			for (const record of records) {
				const index = Math.round((record.date.getTime() - startMillis) / millisInDay);
				articleRecords.records[index] = record;
			}

			// @ts-ignore FIXME
			includedArticleRecords.set(entry.articleId, articleRecords);
		}
	}

	const allPrices = await getPrices(end);

	for (const [articleId, prices] of allPrices.entries()) {
		const articleRecords = includedArticleRecords.get(articleId);
		if (articleRecords == null) continue;

		articleRecords.records = articleRecords.records.map((record, index) => {
			const weekday = (startWeekday + index) % 7;
			const possiblePrices = prices[weekday];

			const date =
				record?.date ||
				dayjs(end)
					.subtract(numOfDays - 1 - index, "days")
					.toDate();

			const price = possiblePrices.find((p) => p.startDate <= date && (p.endDate == null || p.endDate > date))!;

			return record == null
				? {
						date,
						supply: 10,
						remissions: 0,
						price,
				  }
				: { ...record, price };
		});
	}

	return {
		id: vendorId,
		name: vendor.firstName + " " + vendor.lastName,
		articleRecords: [...includedArticleRecords.values()],
	};
}

export async function getVendorRecordsRoute(vendorId: number, end: Date): Promise<RouteReport> {
	return {
		code: 200,
		body: await getVendorRecords(vendorId, end),
	};
}

export async function createOrUpdateArticleRecords(vendorId: number, records: ArticleRecords): Promise<RouteReport> {
	for (const record of records.records) {
		pool.execute(
			`INSERT INTO records (date, article_id, vendor_id, supply, remissions) VALUES (?, ?, ?, ?, ?)
			ON DUPLICATE KEY
			UPDATE supply=?, remissions=?`,
			[
				dayjs(record.date).format("YYYY-MM-DD"),
				records.id,
				vendorId,
				record.supply,
				record.remissions,
				record.supply,
				record.remissions,
			]
		);
	}

	return {
		code: 200,
	};
}
