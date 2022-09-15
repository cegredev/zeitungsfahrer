import pool, { RouteReport } from "../database.js";
import { Record, ArticleRecords, VendorRecords } from "../models/records.model.js";
import dayjs from "dayjs";
import { DATE_FORMAT } from "../consts.js";
import { getVendorFull } from "./vendors.service.js";
import { daysBetween, normalizeDate } from "../time.js";
import { getPrices } from "./articles.service.js";

export async function getVendorRecords(vendorId: number, start: Date, end: Date): Promise<VendorRecords> {
	const vendor = await getVendorFull(vendorId);

	start = normalizeDate(start);
	end = normalizeDate(end);

	console.log(start, end);

	const numOfDays = daysBetween(start, end) + 1;

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
				[vendorId, entry.articleId, dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
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

	const articleRecords = [...includedArticleRecords.values()].map((records) => {
		const prices = records.records.map((record) => [
			(record.supply - record.remissions) * record.price.sell,
			record.price.mwst,
		]);

		return {
			...records,
			totalValueNetto: prices.map(([price, _mwst]) => price).reduce((prev, current) => prev + current),
			totalValueBrutto: prices
				.map(([price, mwst]) => price * (1.0 + mwst / 100))
				.reduce((prev, current) => prev + current),
		};
	});

	return {
		id: vendorId,
		name: vendor.firstName + " " + vendor.lastName,
		articleRecords,
	};
}

export async function getTodaysArticleRecords(vendorId: number): Promise<RouteReport> {
	const response = await pool.execute(
		`
		SELECT articles.name, vendor_supplies.supply FROM articles
		LEFT JOIN vendor_supplies ON articles.id=vendor_supplies.article_id AND vendor_supplies.vendor_id=? AND vendor_supplies.weekday=?
	`,
		[vendorId, (6 + new Date().getDay()) % 7]
	);

	const today = new Date();
	const vendorRecords = await getVendorRecords(
		vendorId,
		dayjs(today)
			.subtract((6 + today.getDay()) % 7, "days")
			.toDate(),
		today
	);

	return {
		code: 200,
		body: {
			// @ts-ignore
			articles: [...response[0]],
			// articles: vendorRecords.articleRecords.map((record) => ({
			// 	name: record.name,
			// 	supply: record.records[0]!.supply,
			// })),
			totalValueBrutto: vendorRecords.articleRecords
				.map((records) => records.totalValueBrutto)
				.reduce((prev, current) => prev + current, 0),
		},
	};
}

export async function getVendorRecordsRoute(vendorId: number, end: Date): Promise<RouteReport> {
	const start = dayjs(end)
		.subtract(7 - 1, "days")
		.toDate();

	return {
		code: 200,
		body: await getVendorRecords(vendorId, start, end),
	};
}

export async function createOrUpdateArticleRecords(vendorId: number, records: ArticleRecords): Promise<RouteReport> {
	await pool.execute("UPDATE vendors SET last_record_entry=? WHERE id=?", [
		dayjs(new Date()).format(DATE_FORMAT),
		vendorId,
	]);

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
