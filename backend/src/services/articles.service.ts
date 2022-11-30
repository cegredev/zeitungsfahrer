import { Article, ArticleInfo, Price, validatePrices } from "../models/articles.model.js";
import pool, { RouteReport } from "../database.js";
import dayjs from "dayjs";
import { DATE_FORMAT } from "../consts.js";
import { getConvertedWeekday, poolExecute } from "../util.js";
import Big from "big.js";

function fixDBPrice(price: Price): Price {
	return {
		...price,
		purchase: Big(price.purchase),
		sell: Big(price.sell),
		marketSell: Big(price.marketSell),
	};
}

// FIXME: Make this work with all amounts of days
export async function getPrices(start: Date, end: Date, articleId: number): Promise<Price[][]> {
	const prices = await poolExecute<Price>(
		`SELECT start_date as startDate, weekday, article_id as articleId, mwst, purchase, sell, market_sell as marketSell, end_date as endDate
		FROM prices
		WHERE start_date <= ? AND (end_date > ? OR end_date IS NULL) AND article_id=?
		ORDER BY start_date`,
		[dayjs(end).format(DATE_FORMAT), dayjs(start).format(DATE_FORMAT), articleId]
	);

	const week: Price[][] = Array(7)
		.fill(null)
		.map(() => []);

	for (const price of prices) {
		week[price.weekday].push(fixDBPrice(price));
	}

	const startWeekday = getConvertedWeekday(start);

	return week.map((prices, index) =>
		prices.length === 0
			? [
					{
						startDate: end,
						weekday: (startWeekday + index) % 7,
						articleId,
						mwst: 0,
						purchase: Big(0),
						sell: Big(0),
						marketSell: Big(0),
					},
			  ]
			: prices
	);
}

export async function getArticles(atDate: Date): Promise<RouteReport> {
	const prices = await poolExecute<Price & { articleId: number; name: string }>(
		`SELECT articles.id as articleId, articles.name, prices.start_date as startDate, prices.weekday,
		prices.purchase, prices.sell, prices.market_sell as marketSell, prices.mwst, prices.end_date as endDate
		FROM articles
		LEFT OUTER JOIN prices
		ON articles.id=prices.article_id AND ? >= prices.start_date AND (? < prices.end_date OR prices.end_date IS NULL)`,
		[atDate, atDate]
	);

	const articles = new Map<number, Article>();

	for (let price of prices) {
		const realPrice = fixDBPrice(price);
		price = { ...price, ...realPrice };

		let article = articles.get(price.articleId);
		if (article == null) {
			article = { id: price.articleId, name: price.name, prices: [] };
			articles.set(price.articleId, article);
		}

		article.prices.push(realPrice);
	}

	return {
		code: 200,
		body: [...articles.values()],
	};
}

export async function getArticleInfo(articleId: number): Promise<ArticleInfo> {
	const res = await poolExecute<ArticleInfo>("SELECT id, name FROM articles WHERE id=?", [articleId]);
	return res[0];
}

export async function getArticleInfos(): Promise<ArticleInfo[]> {
	return await poolExecute<ArticleInfo>("SELECT id, name FROM articles");
}

export async function getArticleInfosRoute(): Promise<RouteReport> {
	return { code: 200, body: await getArticleInfos() };
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
	await pool.execute("DELETE FROM articles WHERE id=?", [id]);

	return {
		code: 200,
	};
}
