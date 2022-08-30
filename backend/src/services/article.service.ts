import { Article, Price, validatePrices } from "../models/article.model.js";
import pool, { RouteReport } from "../database.js";
import dayjs from "dayjs";

export async function getArticles(): Promise<RouteReport> {
	const result = await pool.execute(
		"SELECT articles.id, articles.name, prices.start_date, prices.purchase, prices.sell, prices.market_sell, prices.mwst FROM articles LEFT OUTER JOIN prices ON articles.id=prices.article_id"
	);

	const articles = new Map<number, Article>();

	// @ts-ignore
	for (const { id, name, start_date, mwst, purchase, sell, market_sell } of result[0]) {
		let article = articles.get(id);
		if (article == null) {
			article = { id, name, prices: [] };
			articles.set(id, article);
		}

		article.prices.push({
			startDate: start_date,
			mwst,
			purchase,
			sell,
			marketSell: market_sell,
		});
	}

	return {
		code: 200,
		body: JSON.stringify([...articles.values()]),
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
			body: "The given prices contained errors",
		};
	}

	const result = await pool.execute(`INSERT INTO articles (name) VALUES (?)`, [name]);

	// @ts-ignore
	const id: number = result[0].insertId;
	const startDate = new Date();

	await createPrices(startDate, id, prices);

	return {
		code: 201,
		body: JSON.stringify({ id }),
	};
}

export async function updateArticle(startDate: Date, article: Article): Promise<RouteReport> {
	const { id, name } = article;

	if (!validatePrices(article.prices)) {
		return {
			code: 400,
			body: "The given prices contained errors",
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
	await pool.execute("DELETE FROM prices WHERE article_id=?", [id]);
	await pool.execute("DELETE FROM articles WHERE id=?", [id]);

	return {
		code: 200,
	};
}
