import { Article, Price, validatePrices } from "../models/article.model.js";
import pool, { RouteReport } from "../database.js";

export async function getArticles(): Promise<RouteReport> {
	const conn = await pool.getConnection();
	const result = await conn.execute(
		"SELECT articles.id, articles.name, prices.purchase, prices.sell, prices.mwst FROM articles INNER JOIN prices ON articles.id=prices.article_id"
	);

	let prices: Price[] = [];
	const articles: Article[] = [];

	// @ts-ignore
	for (const { id, name, mwst, purchase, sell } of result[0]) {
		prices.push({ purchase, sell, mwst });

		if (prices.length >= 7) {
			articles.push({ id, name, prices });
			prices = [];
		}
	}

	console.log(articles);

	return {
		code: 200,
		body: JSON.stringify(articles),
	};
}

export async function createArticle(name: string, prices: Price[]): Promise<RouteReport> {
	if (!validatePrices(prices)) {
		return {
			code: 400,
			body: "The given prices contained errors",
		};
	}

	const conn = await pool.getConnection();
	const result = await conn.execute(`INSERT INTO articles (name) VALUES (?)`, [name]);

	// @ts-ignore
	const id: number = result[0].insertId;

	const queryString =
		"INSERT INTO prices (weekday, article_id, purchase, sell, mwst) VALUES " +
		prices
			.map((price, weekday) => `(${weekday}, ${id}, ${price.purchase}, ${price.sell}, ${price.mwst})`)
			.join(",");

	await conn.query(queryString);

	return {
		code: 200,
		body: JSON.stringify({ id }),
	};
}

export async function updateArticle(article: Article): Promise<RouteReport> {
	const { id, name } = article;

	if (!validatePrices(article.prices)) {
		return {
			code: 400,
			body: "The given prices contained errors",
		};
	}

	const conn = await pool.getConnection();

	await conn.execute(`UPDATE articles SET name=? WHERE id=?`, [name, id]);

	article.prices.forEach(async (price, weekday) => {
		await conn.execute(`UPDATE prices SET purchase=?, sell=?, mwst=? WHERE article_id=? AND weekday=?`, [
			price.purchase,
			price.sell,
			price.mwst,
			id,
			weekday,
		]);
	});

	return {
		code: 200,
	};
}

export async function deleteArticle(id: number): Promise<RouteReport> {
	const conn = await pool.getConnection();

	await conn.execute("DELETE FROM prices WHERE article_id=?", [id]);
	await conn.execute("DELETE FROM articles WHERE id=?", [id]);

	return {
		code: 200,
	};
}
