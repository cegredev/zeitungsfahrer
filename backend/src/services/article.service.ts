import { Article, Price } from "../models/article.model";
import { connection } from "../database";

export function getArticles(callback: (articles: Article[]) => void) {
	connection.query(
		"SELECT articles.id, articles.name, articles.mwst, prices.purchase, prices.sell FROM articles INNER JOIN prices ON articles.id=prices.article_id",
		(err, rows, fields) => {
			if (err) throw err;

			const articles: Article[] = [];
			let prices: Price[] = [];

			for (const { id, name, mwst, purchase, sell } of rows) {
				prices.push({ purchase, sell });

				if (prices.length >= 7) {
					articles.push({ id, name, mwst, prices });
					prices = [];
				}
			}

			console.log(articles);
			callback(articles);
		}
	);
}
