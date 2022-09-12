import { Article, Price, validatePrices } from "../models/article.model.js";
import pool, { RouteReport } from "../database.js";
import dayjs from "dayjs";

export async function getArticles(atDate: Date): Promise<RouteReport> {
	const result = await pool.execute(
		`SELECT articles.id, articles.name, prices.start_date, prices.weekday, prices.purchase, prices.sell, prices.market_sell, prices.mwst, prices.end_date
		FROM articles
		LEFT OUTER JOIN prices
		ON articles.id=prices.article_id AND ? >= prices.start_date AND (? < prices.end_date OR prices.end_date IS NULL)`,
		[atDate, atDate]
	);

	const articles = new Map<number, Article>();

	// @ts-ignore
	for (const { id, name, start_date, weekday, mwst, purchase, sell, market_sell, end_date } of result[0]) {
		let article = articles.get(id);
		if (article == null) {
			article = { id, name, prices: [] };
			articles.set(id, article);
		}

		article.prices.push({
			startDate: start_date,
			weekday,
			articleId: id,
			mwst,
			purchase,
			sell,
			marketSell: market_sell,
			endDate: end_date,
		});
	}

	return {
		code: 200,
		body: [...articles.values()],
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

	return {
		code: 200,
		body: response[0],
	};
}

export async function createPrices(startDate: Date, articleId: number, prices: Price[]): Promise<void> {
	await pool.query(
		"INSERT INTO prices (start_date, weekday, article_id, mwst, purchase, sell, market_sell) VALUES " +
			prices
				.map(
					(price, weekday) =>
						`("${dayjs(startDate).format("YYYY-MM-DD")}", ${weekday}, ${articleId}, ${price.mwst}, ${
							price.purchase
						}, ${price.sell}, ${price.marketSell})`
				)
				.join(",")
	);
}

export async function createArticle(name: string, prices: Price[]): Promise<RouteReport> {
	if (!validatePrices(prices)) {
		return {
			code: 400,
			body: { userMessage: "Die angegebenen Preise enthielten Fehler." },
		};
	}

	// @ts-ignore
	if ((await pool.execute("SELECT 1 FROM articles WHERE name=?", [name]))[0].length >= 1) {
		return {
			code: 400,
			body: { userMessage: "Es gibt bereits einen Artikel mit diesem Namen." },
		};
	}

	const result = await pool.execute(`INSERT IGNORE INTO articles (name) VALUES (?)`, [name]);

	// @ts-ignore
	const id: number = result[0].insertId;

	await createPrices(new Date("1970-01-01"), id, prices);

	return {
		code: 201,
		body: { id },
	};
}

export async function updateArticle(startDate: Date, article: Article): Promise<RouteReport> {
	const { id, name } = article;

	if (!validatePrices(article.prices)) {
		return {
			code: 400,
			body: {
				userMessage: "Die angegebenen Preise enthielten Fehler.",
			},
		};
	}

	await pool.execute("UPDATE articles SET name=? WHERE id=?", [name, id]);

	const affectedPrices: Price[] = [];
	let weekday = 0;
	for await (const price of article.prices) {
		const result = await pool.execute(
			"UPDATE prices SET end_date=? WHERE article_id=? AND weekday=? AND end_date IS NULL AND start_date < ?",
			[startDate, article.id, weekday, startDate]
		);

		// @ts-ignore
		if (result[0].affectedRows > 0) {
			affectedPrices.push(price);
		} else {
			await pool.execute(
				"UPDATE prices SET mwst=?, purchase=?, sell=?, market_sell=? WHERE article_id=? AND weekday=? and start_date=?",
				[price.mwst, price.purchase, price.sell, price.marketSell, id, weekday, price.startDate]
			);
		}

		weekday++;
	}

	if (affectedPrices.length > 0) await createPrices(startDate, id!, affectedPrices);

	return {
		code: 200,
	};
}

export async function deleteArticle(id: number): Promise<RouteReport> {
	// TODO: Check if this is redundant due to cascading
	await pool.execute("DELETE FROM prices WHERE article_id=?", [id]);
	await pool.execute("DELETE FROM articles WHERE id=?", [id]);

	return {
		code: 200,
	};
}
