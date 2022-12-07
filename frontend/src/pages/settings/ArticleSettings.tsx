import { Article } from "backend/src/models/articles.model";
import Big from "big.js";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import ArticleSettingsItem from "../../components/ArticleSettingsItem";
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
			const response = await GET<Article[]>(
				"/auth/main/articles?atDate=" + dayjs(new Date()).format("YYYY-MM-DD"),
				token!
			);
			const articles = response.data;

			setArticles(
				articles.map((article) => ({
					...article,
					prices: article.prices.map((price) => ({
						...price,
						purchase: Big(price.purchase),
						sell: Big(price.sell),
						marketSell: Big(price.marketSell),
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
							return (
								<ArticleSettingsItem key={"article-" + (article.id || "draft")} articleInfo={article} />
							);
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
