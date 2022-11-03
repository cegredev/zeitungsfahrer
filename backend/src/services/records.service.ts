import pool, { RouteReport } from "../database.js";
import { Record, ArticleRecords, Sales, ArticleSales, VendorSales, ChangedRecord } from "../models/records.model.js";
import dayjs from "dayjs";
import { DATE_FORMAT, MILlIS_IN_DAY } from "../consts.js";
import { getIncludedArticles, getVendorCatalog } from "./vendors.service.js";
import { daysBetween, normalizeDate } from "../time.js";
import { getPrices } from "./articles.service.js";
import { getConvertedWeekday, poolExecute } from "../util.js";
import settings from "./settings.service.js";
import { ArticleInfo } from "../models/articles.model.js";

async function applyPrices(
	start: Date,
	end: Date,
	articlesRecords: { id: number; records: Record[] }[]
): Promise<void> {
	for (const article of articlesRecords) {
		const prices = await getPrices(start, end, article.id);

		article.records.forEach((record, i) => {
			const possiblePrices = prices[getConvertedWeekday(record.date)];

			const price = possiblePrices.find(
				(p) => p.startDate <= record.date && (p.endDate == null || p.endDate > record.date)
			)!;

			article.records[i] = { ...record, price };
		});
	}
}

async function getExistingRecords(
	vendorId: number,
	articleId: number,
	start: Date,
	end: Date
): Promise<{ date: Date; supply: number; remissions: number; missing: boolean }[]> {
	return (
		await poolExecute(
			`
				SELECT date, supply, remissions FROM records
				WHERE vendor_id=? AND article_id=? AND date BETWEEN ? AND ?
				ORDER BY article_id
			`,
			[vendorId, articleId, dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
		)
	).map((r: any) => ({ ...r, missing: false }));
}

export function calculateSalesValues(records: Record[]): { totalValueNetto: number; totalValueBrutto: number } {
	const values = records.map((record) => [
		record.missing ? 0 : (record.supply - record.remissions) * record.price!.sell,
		record.price!.mwst,
	]);

	return {
		totalValueNetto: values.map(([price, _mwst]) => price).reduce((prev, current) => prev + current),
		totalValueBrutto: values
			.map(([price, mwst]) => price * (1.0 + mwst / 100))
			.reduce((prev, current) => prev + current),
	};
}

export async function getArticleRecords(
	vendorId: number,
	articleId: number,
	start: Date,
	end: Date
): Promise<ArticleRecords> {
	start = normalizeDate(start);
	end = normalizeDate(end);

	const catalogEntry = (await getVendorCatalog(vendorId, articleId)).entries[0];

	let articleRecords = {
		id: articleId,
		name: catalogEntry.articleName,
		start,
		records: Array(daysBetween(start, end) + 1).fill(null),
	};

	const records = await getExistingRecords(vendorId, articleId, start, end),
		startMillis = start.getTime();
	for (const record of records) {
		articleRecords.records[Math.round((record.date.getTime() - startMillis) / MILlIS_IN_DAY)] = record;
	}

	const startWeekday = getConvertedWeekday(start);
	articleRecords.records = articleRecords.records.map((record, index) => {
		if (record !== null) return record;

		return {
			date: dayjs(start).add(index, "days").toDate(),
			supply: catalogEntry.supplies[(startWeekday + index) % 7],
			remissions: 0,
			missing: true,
		};
	});

	await applyPrices(start, end, [articleRecords]);

	return { ...articleRecords, ...calculateSalesValues(articleRecords.records) };
}

export async function getAllSales(date: Date): Promise<number[]> {
	async function makeRequest(start: Date, end: Date) {
		const records = await poolExecute<Record>(
			"SELECT date, article_id AS articleId, (supply - remissions) AS sales FROM records WHERE date BETWEEN ? AND ?",
			[dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
		);

		const map = new Map<number, ArticleRecords>();

		for (const record of records) {
			let articleRecords = map.get(record.articleId!);
			if (articleRecords === undefined) {
				// @ts-ignore
				articleRecords = {
					id: record.articleId!,
					records: [],
				};
				map.set(record.articleId!, articleRecords!);
			}

			articleRecords?.records.push(record);
		}

		await applyPrices(start, end, [...map.values()]);

		const rs = [...map.values()].map((r) => r.records).reduce((a, b) => a.concat(b), []);

		return rs
			.map((r) => {
				// @ts-ignore
				const sales = r.sales;

				return (r.price!.sell * sales * (100 + r.price!.mwst)) / 100;
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
		case 0: // Day
			start = dayjs(end).toDate();
			break;
		case 1: // Week
			start = dayjs(end).subtract(getConvertedWeekday(end), "days").toDate();
			end = dayjs(start).add(6, "days").toDate();
			break;
		case 2: // Month
			start = dayjs(end).set("date", 1).toDate();
			end = dayjs(start).add(1, "month").subtract(1, "day").toDate();
			break;
		case 3: // Year
			start = new Date(end.getUTCFullYear() + "-01-01");
			end = dayjs(start).add(1, "year").subtract(1, "day").toDate();
			break;
	}

	return [start, end];
}

export async function getArticleRecordsAdjusted(
	vendorId: number,
	initialEnd: Date,
	articleId: number
): Promise<ArticleRecords[] | ArticleRecords> {
	const [start, end] = getDateRange(initialEnd, Math.min(2, settings.invoiceSystem)); // Records cant be shown as year

	return await getArticleRecords(vendorId, articleId, start, end);
}

export async function getTodaysArticleRecords(vendorId: number): Promise<RouteReport> {
	const today = new Date();
	const [start, end] = getDateRange(today, settings.invoiceSystem);

	let total = 0;
	for (const article of await getIncludedArticles(vendorId)) {
		const records = await getArticleRecords(vendorId, article.id, start, end);
		total += records.totalValueBrutto;
	}

	const catalog = await getVendorCatalog(vendorId);
	const weekday = getConvertedWeekday(today);

	return {
		code: 200,
		body: {
			articles: catalog.entries
				.filter((entry) => entry.included)
				.map((entry) => ({ name: entry.articleName, supply: entry.supplies[weekday] })),
			totalValueBrutto: total,
		},
	};
}

export async function getArticleSales(articleId: number, end: Date): Promise<ArticleSales> {
	async function makeRequest(start: Date, end: Date): Promise<Sales> {
		const response = await pool.execute(
			"SELECT IFNULL(SUM(supply), 0) as totalSupply, IFNULL(SUM(remissions), 0) as totalRemissions FROM records WHERE article_id=? AND date BETWEEN ? AND ?",
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
		let total = 0;
		for (const entry of catalog.entries) {
			if (!entry.included) continue;

			const records = await getExistingRecords(vendorId, entry.articleId, start, end);
			if (records.length === 0) continue;

			await applyPrices(start, end, [{ id: entry.articleId, records }]);

			total += calculateSalesValues(records).totalValueBrutto;
		}

		return total;
	}

	const catalog = await getVendorCatalog(vendorId);

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

export async function createOrUpdateArticleRecords(vendorId: number, records: ChangedRecord[]): Promise<RouteReport> {
	for (const record of records) {
		pool.execute(
			`INSERT INTO records (date, article_id, vendor_id, supply, remissions) VALUES (?, ?, ?, ?, ?)
			ON DUPLICATE KEY
			UPDATE supply=?, remissions=?`,
			[
				dayjs(record.date).format("YYYY-MM-DD"),
				record.articleId,
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
