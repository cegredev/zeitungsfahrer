import { ArticleInfo, Price } from "shared/src/models/article.js";
import connection from "../database.js";

export async function getArticles() {
	const result = await connection.execute(
		"SELECT articles.id, articles.name, articles.mwst, prices.purchase, prices.sell FROM articles INNER JOIN prices ON articles.id=prices.article_id"
	);

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

	return articles;
}

export async function createArticle(name: string, mwst: number, prices: Price[]): Promise<number> {
	const result = await connection.execute(`INSERT INTO articles (name, mwst) VALUES (?, ?)`, [name, mwst]);

	// @ts-ignore
	const id = result[0].insertId;

	let queryString = "INSERT INTO prices (weekday, article_id, purchase, sell) VALUES ";

	prices.forEach(async (price, weekday) => {
		queryString += `(${weekday}, ${id}, ${price.purchase}, ${price.sell}),`;
	});
	queryString = queryString.substring(0, queryString.length - 1); // Remove trailing comma

	await connection.query(queryString);

	return id;
}

export async function updateArticle(article: ArticleInfo) {
	const { id, name, mwst } = article.data;

	let queryString = `UPDATE articles SET name="${name}", mwst=${mwst} WHERE id=${id};`;

	article.prices.forEach(async (price, weekday) => {
		queryString += `UPDATE prices SET purchase=${price.purchase}, sell=${price.sell} WHERE article_id=${id} AND weekday=${weekday};`;
	});

	await connection.query(queryString);
}

export async function deleteArticle(id: number) {
	await connection.query(
		`
			DELETE FROM prices WHERE article_id=${id};
			DELETE FROM articles WHERE id=${id};
		`
	);
}
