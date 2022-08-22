import { useAtom } from "jotai";
import React from "react";
import { articlesListAtom, setArticlesAtom, draftArticleAtom } from "../store";
import Article from "./Article";
import { GET } from "../api";

function ArticlesList() {
	const [articles] = useAtom(articlesListAtom);
	const [, setArticles] = useAtom(setArticlesAtom);
	const [, createArticle] = useAtom(draftArticleAtom);

	React.useEffect(() => {
		async function fetchArticles() {
			const articles = await GET("articles");
			setArticles(await articles.json());
		}

		fetchArticles();
	}, [setArticles]);

	return (
		<div className="article-list">
			{articles.map((article) => {
				return <Article key={"article-" + article.data.id} articleInfo={article} />;
			})}

			{!articles.some((article) => article.data.id == null) && (
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
