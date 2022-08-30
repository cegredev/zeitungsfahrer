import { useAtom } from "jotai";
import React from "react";
import { articlesListAtom, setArticlesAtom, draftArticleAtom } from "./stores/article.store";
import Article from "./Article";
import { GET } from "../api";
import { Article as ArticleInfo } from "backend/src/models/article.model";
import dayjs from "dayjs";

function ArticlesList() {
	const [articles] = useAtom(articlesListAtom);
	const [, setArticles] = useAtom(setArticlesAtom);
	const [, createArticle] = useAtom(draftArticleAtom);

	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		async function fetchArticles() {
			const response = await GET("/articles?atDate=" + dayjs(new Date()).format("YYYY-MM-DD"));
			const articles: ArticleInfo[] = await response.json();

			setArticles(
				articles.map((article) => ({
					...article,
					prices: article.prices.map((price) => ({
						purchase: parseFloat(String(price.purchase)),
						sell: parseFloat(String(price.sell)),
						marketSell: parseFloat(String(price.marketSell)),
						mwst: price.mwst,
						startDate: price.startDate,
					})),
				}))
			);

			setLoading(false);
		}

		fetchArticles();
	}, [setArticles]);

	return (
		<div className="article-list">
			{loading
				? "Laden..."
				: articles.map((article) => {
						return <Article key={"article-" + (article.id || "draft")} articleInfo={article} />;
				  })}
			{!articles.some((article) => article.id == null) && (
				<div>
					<button className="create-item" onClick={createArticle}>
						Artikel hinzufügen
					</button>
				</div>
			)}
		</div>
	);
}

export default ArticlesList;
