import { useAtom } from "jotai";
import React from "react";
import { articlesListAtom, setArticlesAtom, draftArticleAtom } from "../store";
import Article from "./Article";
import { GET } from "../api";
import { Article as ArticleInfo } from "backend/src/models/article.model";

function ArticlesList() {
	const [articles] = useAtom(articlesListAtom);
	const [, setArticles] = useAtom(setArticlesAtom);
	const [, createArticle] = useAtom(draftArticleAtom);

	React.useEffect(() => {
		async function fetchArticles() {
			const response = await GET("articles");
			const articles: ArticleInfo[] = await response.json();

			setArticles(
				articles.map((article) => ({
					...article,
					prices: article.prices.map((price) => ({
						purchase: parseFloat(String(price.purchase)),
						sell: parseFloat(String(price.sell)),
						marketSell: parseFloat(String(price.marketSell)),
						mwst: price.mwst,
					})),
				}))
			);
		}

		fetchArticles();
	}, [setArticles]);

	return (
		<div className="article-list">
			{articles.map((article) => {
				return <Article key={"article-" + (article.id || "draft")} articleInfo={article} />;
			})}
			{!articles.some((article) => article.id == null) && (
				<div>
					<button className="create-article" onClick={createArticle}>
						Artikel hinzufügen
					</button>
				</div>
			)}
		</div>
	);
}

export default ArticlesList;
