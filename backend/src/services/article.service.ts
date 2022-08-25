import { ArticleInfo, Price } from "../models/article.model.js";
import pool, { RouteReport } from "../database.js";

export async function getArticles(): Promise<RouteReport> {
	console.log("in service");
	const conn = await pool.getConnection();
	console.log("got");
	const result = await conn.execute(
		"SELECT articles.id, articles.name, articles.mwst, prices.purchase, prices.sell FROM articles INNER JOIN prices ON articles.id=prices.article_id"
	);
	console.log("ran");

	let prices: Price[] = [];
	const articles: ArticleInfo[] = [];

	// @ts-ignore
	for (const { id, name, mwst, purchase, sell } of result[0]) {
		prices.push({ purchase, sell });

		if (prices.length >= 7) {
			articles.push({ data: { id, name, mwst }, prices });
			prices = [];
		}
	}

	return {
		code: 200,
		body: JSON.stringify(articles),
	};
}

export async function createArticle(name: string, mwst: number, prices: Price[]): Promise<RouteReport> {
	if (mwst < 0 || prices.length !== 7) {
		return {
			code: 400,
			body: "Invalid input",
		};
	}

	const conn = await pool.getConnection();
	const result = await conn.execute(`INSERT INTO articles (name, mwst) VALUES (?, ?)`, [name, mwst]);

	// @ts-ignore
	const id: number = result[0].insertId;

	const queryString =
		"INSERT INTO prices (weekday, article_id, purchase, sell) VALUES " +
		prices.map((price, weekday) => `(${weekday}, ${id}, ${price.purchase}, ${price.sell})`).join(",");

	await conn.query(queryString);

	return {
		code: 200,
		body: JSON.stringify({ id }),
	};
}

export async function updateArticle(article: ArticleInfo): Promise<RouteReport> {
	const { id, name, mwst } = article.data;

	if (mwst < 0 || article.prices.length !== 7) {
		return {
			code: 400,
			body: "Invalid input",
		};
	}

	let queryString = `UPDATE articles SET name="${name}", mwst=${mwst} WHERE id=${id};`;

	article.prices.forEach(async (price, weekday) => {
		queryString += `UPDATE prices SET purchase=${price.purchase}, sell=${price.sell} WHERE article_id=${id} AND weekday=${weekday};`;
	});

	const conn = await pool.getConnection();
	await conn.query(queryString);

	return {
		code: 200,
	};
}

export async function deleteArticle(id: number): Promise<RouteReport> {
	const conn = await pool.getConnection();
	await conn.query(
		`
			DELETE FROM prices WHERE article_id=${id};
			DELETE FROM articles WHERE id=${id};
		`
	);

	return {
		code: 200,
	};
}
