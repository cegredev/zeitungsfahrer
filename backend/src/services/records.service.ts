import pool, { RouteReport } from "../database.js";
import { Record, ArticleRecords, VendorRecords, Sales, ArticleSales, VendorSales } from "../models/records.model.js";
import dayjs from "dayjs";
import { DATE_FORMAT } from "../consts.js";
import { getVendorFull } from "./vendors.service.js";
import { daysBetween, normalizeDate } from "../time.js";
import { getPrices } from "./articles.service.js";
import { getConvertedWeekday } from "../util.js";
import settings from "./settings.service.js";

async function mapRecordsToPrices(start: Date, end: Date, articlesRecords: Map<number, ArticleRecords>): Promise<void> {
	const allPrices = await getPrices(start, end);

	for (const [articleId, prices] of allPrices.entries()) {
		const articleRecords = articlesRecords.get(articleId);
		if (articleRecords == null) continue;

		articleRecords.records = articleRecords.records.map((record) => {
			const possiblePrices = prices[getConvertedWeekday(record.date)];

			const price = possiblePrices.find(
				(p) => p.startDate <= record.date && (p.endDate == null || p.endDate > record.date)
			)!;

			return { ...record, price };
		});
	}
}

export async function getVendorRecords(vendorId: number, start: Date, end: Date): Promise<VendorRecords> {
	const vendor = await getVendorFull(vendorId);

	start = normalizeDate(start);
	end = normalizeDate(end);

	const numOfDays = daysBetween(start, end) + 1;

	const millisInDay = 24 * 60 * 60 * 1_000,
		startMillis = start.getTime(),
		startWeekday = getConvertedWeekday(start);

	const includedArticleRecords: Map<number, ArticleRecords> = new Map();
	for (const entry of vendor.catalog!.entries) {
		if (!entry.included) continue;

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
					missing: true,
				})),
		};

		// @ts-ignore
		const records: Record[] = response[0];
		for (const record of records) {
			const index = Math.round((record.date.getTime() - startMillis) / millisInDay);
			articleRecords.records[index] = { ...record, missing: false };
		}

		// @ts-ignore Missing fields are going to be added later
		includedArticleRecords.set(entry.articleId, articleRecords);
	}

	await mapRecordsToPrices(start, end, includedArticleRecords);

	const articleRecords = [...includedArticleRecords.values()].map((records) => {
		const prices = records.records.map((record) => [
			record.missing ? 0 : (record.supply - record.remissions) * record.price.sell,
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

export async function getAllSales(date: Date): Promise<number[]> {
	async function makeRequest(start: Date, end: Date) {
		const response = await pool.execute(
			"SELECT date, article_id AS articleId, (supply - remissions) AS sales FROM records WHERE date BETWEEN ? AND ?",
			[dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
		);

		// @ts-ignore
		const records: Record[] = response[0];

		const map = new Map<number, ArticleRecords>();

		for (const record of records) {
			console.log(record);

			let articleRecords = map.get(record.articleId!);
			if (articleRecords === undefined) {
				// @ts-ignore
				articleRecords = {
					records: [],
				};
				map.set(record.articleId!, articleRecords!);
			}

			articleRecords?.records.push(record);
		}

		await mapRecordsToPrices(start, end, map);

		const rs = [...map.values()].map((r) => r.records).reduce((a, b) => a.concat(b), []);

		return rs
			.map((r) => {
				// @ts-ignore
				const sales = r.sales;

				return (r.price.sell * sales * (100 + r.price.mwst)) / 100;
			})
			.reduce((a, b) => a + b, 0);
	}

	const sales = [];
	for (let i = 3; i >= 0; i--) sales.push(await makeRequest(...getDateRange(date, i)));

	return sales;
}

export async function getAllSalesRoute(date: Date): Promise<RouteReport> {
	return {
		code: 200,
		body: await getAllSales(date),
	};
}

export function getDateRange(end: Date, system: number): [Date, Date] {
	end = normalizeDate(end);
	let start = end;

	switch (system) {
		case 0:
			start = dayjs(end).toDate();
			break;
		case 1:
			start = dayjs(end).subtract(getConvertedWeekday(end), "days").toDate();
			break;
		case 2:
			start = dayjs(end).set("date", 1).toDate();
			end = dayjs(start).add(1, "month").subtract(1, "day").toDate();
			break;
		case 3:
			start = new Date(end.getUTCFullYear() + "-01-01");
			end = dayjs(start).add(1, "year").subtract(1, "day").toDate();
			break;
	}

	return [start, end];
}

export async function getVendorRecordsAdjusted(vendorId: number, initialEnd: Date): Promise<VendorRecords> {
	const [start, end] = getDateRange(initialEnd, Math.min(2, settings.invoiceSystem)); // Records cant be shown as year

	return await getVendorRecords(vendorId, start, end);
}

export async function getVendorRecordsRoute(vendorId: number, end: Date): Promise<RouteReport> {
	return {
		code: 200,
		body: await getVendorRecordsAdjusted(vendorId, end),
	};
}

export async function getTodaysArticleRecords(vendorId: number): Promise<RouteReport> {
	const today = normalizeDate(new Date());
	const weekday = getConvertedWeekday(today);

	const response = await pool.execute(
		`
		SELECT articles.id, articles.name, vendor_supplies.supply, vendor_catalog.included FROM articles
		LEFT JOIN vendor_supplies ON articles.id=vendor_supplies.article_id AND vendor_supplies.vendor_id=? AND vendor_supplies.weekday=?
		LEFT JOIN vendor_catalog ON articles.id=vendor_catalog.article_id AND vendor_catalog.vendor_id=?
	`,
		[vendorId, weekday, vendorId]
	);

	console.log(dayjs(today).subtract(weekday, "days").toDate());

	const vendorRecords = await getVendorRecordsAdjusted(vendorId, today);

	// @ts-ignore
	let articles: { id: number; name: string; supply: number; included: any }[] = [...response[0]];
	articles = articles.map((a) => {
		const article = { ...a, included: a.included === 1 };

		if (!article.included) return article;

		const articleRecords = vendorRecords.articleRecords.find((articleRecords) => articleRecords.id === article.id);
		if (articleRecords == null) return article;

		return { ...article, supply: articleRecords.records[articleRecords.records.length - 1]!.supply };
	});

	return {
		code: 200,
		body: {
			articles,
			totalValueBrutto: vendorRecords.articleRecords
				.map((records) => records.totalValueBrutto)
				.reduce((prev, current) => prev + current, 0),
		},
	};
}

export async function getArticleSales(articleId: number, end: Date): Promise<ArticleSales> {
	async function makeRequest(start: Date, end: Date): Promise<Sales> {
		const response = await pool.execute(
			"SELECT SUM(supply) as totalSupply, SUM(remissions) as totalRemissions FROM records WHERE article_id=? AND date BETWEEN ? AND ?",
			[articleId, dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
		);

		// @ts-ignore
		const sales: any = response[0][0];

		return { remissions: parseInt("" + sales.totalRemissions), supply: parseInt("" + sales.totalSupply) };
	}

	const sales = [];
	for (let i = 3; i >= 0; i--) sales.push(await makeRequest(...getDateRange(end, i)));

	return { sales };
}

export async function getArticleSalesRoute(articleId: number, end: Date): Promise<RouteReport> {
	return {
		code: 200,
		body: await getArticleSales(articleId, end),
	};
}

export async function getVendorSales(vendorId: number, date: Date): Promise<VendorSales> {
	async function makeRequest(start: Date, end: Date): Promise<number> {
		const records = await getVendorRecords(vendorId, start, end);
		return records.articleRecords.map((r) => r.totalValueBrutto).reduce((a, b) => a + b, 0);
	}

	const sales = [];
	for (let i = 3; i >= 0; i--) sales.push(await makeRequest(...getDateRange(date, i)));

	return { sales };
}

export async function getVendorSalesRoute(articleId: number, end: Date): Promise<RouteReport> {
	return {
		code: 200,
		body: await getVendorSales(articleId, end),
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
