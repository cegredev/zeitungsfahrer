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

export function createArticle(name: string, mwst: number, prices: Price[], callback: (err?: Error) => void) {
	connection.query(
		`INSERT INTO articles (name, mwst) VALUES ("${name}", ${mwst});
					  SELECT id FROM articles ORDER BY id DESC LIMIT 1;`,
		(err, rows) => {
			if (err) {
				callback(err);
				return;
			}

			console.log("rows:", rows);
			const id = rows[1][0].id;

			prices.forEach((price, weekday) => {
				console.log(id, price, weekday);
				connection.query(
					`INSERT INTO prices (weekday, article_id, purchase, sell) VALUES (
					${weekday}, ${id}, ${price.purchase}, ${price.sell}
				)`,
					(err) => {
						if (err) callback(err);
					}
				);
			});

			callback();
		}
	);
}
