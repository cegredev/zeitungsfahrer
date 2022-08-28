import { Article, Price, validatePrices } from "../models/article.model.js";
import pool, { RouteReport } from "../database.js";

export async function getArticles(): Promise<RouteReport> {
	const result = await pool.execute(
		"SELECT articles.id, articles.name, prices.purchase, prices.sell, prices.market_sell, prices.mwst FROM articles LEFT OUTER JOIN prices ON articles.id=prices.article_id"
	);

	const articles = new Map<number, Article>();

	// @ts-ignore
	for (const { id, name, mwst, purchase, sell, market_sell } of result[0]) {
		let article = articles.get(id);
		if (article == null) {
			article = { id, name, prices: [] };
			articles.set(id, article);
		}

		article.prices.push({
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

	const queryString =
		"INSERT INTO prices (weekday, article_id, purchase, sell, market_sell, mwst) VALUES " +
		prices
			.map(
				(price, weekday) =>
					`(${weekday}, ${id}, ${price.purchase}, ${price.sell}, ${price.marketSell}, ${price.mwst})`
			)
			.join(",");

	await pool.query(queryString);

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

	await pool.execute("UPDATE articles SET name=? WHERE id=?", [name, id]);

	article.prices.forEach(async (price, weekday) => {
		await pool.execute(
			`UPDATE prices SET purchase=?, sell=?, market_sell=?, mwst=? WHERE article_id=? AND weekday=?`,
			[price.purchase, price.sell, price.marketSell, price.mwst, id, weekday]
		);
	});

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
