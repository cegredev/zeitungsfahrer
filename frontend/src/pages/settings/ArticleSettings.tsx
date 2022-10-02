import { Article } from "backend/src/models/articles.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import ArticleComp from "../../components/ArticleComp";
import Footer from "../../components/Footer";
import { articlesListAtom, draftArticleAtom, setArticlesAtom } from "../../stores/article.store";
import { authTokenAtom } from "../../stores/utility.store";

function ArticleSettings() {
	const [articles] = useAtom(articlesListAtom);
	const [, setArticles] = useAtom(setArticlesAtom);
	const [, createArticle] = useAtom(draftArticleAtom);
	const [token] = useAtom(authTokenAtom);

	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		async function fetchArticles() {
			const response = await GET("/auth/articles?atDate=" + dayjs(new Date()).format("YYYY-MM-DD"), token!);
			const articles: Article[] = await response.json();

			setArticles(
				articles.map((article) => ({
					...article,
					prices: article.prices.map((price) => ({
						...price,
						purchase: parseFloat(String(price.purchase)),
						sell: parseFloat(String(price.sell)),
						marketSell: parseFloat(String(price.marketSell)),
					})),
				}))
			);

			setLoading(false);
		}

		fetchArticles();
	}, [setArticles, token]);

	return (
		<div className="page">
			<div className="article-list">
				{loading
					? "Laden..."
					: articles.map((article) => {
							return <ArticleComp key={"article-" + (article.id || "draft")} articleInfo={article} />;
					  })}
				{!articles.some((article) => article.id == null) && (
					<div>
						<button className="create-item" onClick={createArticle}>
							Artikel hinzufügen
						</button>
					</div>
				)}
			</div>

			<Footer />
		</div>
	);
}

export default ArticleSettings;
