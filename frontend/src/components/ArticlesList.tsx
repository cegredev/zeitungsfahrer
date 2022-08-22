import { useAtom } from "jotai";
import React from "react";
import { articlesListAtom, setArticlesAtom } from "../store";
import Article from "./Article";
import { GET } from "../api";

function ArticlesList() {
	const [articles] = useAtom(articlesListAtom);
	const [, setArticles] = useAtom(setArticlesAtom);

	React.useEffect(() => {
		async function fetchArticles() {
			const articles = await GET("articles");
			setArticles(await articles.json());
		}

		fetchArticles();
	}, [setArticles]);

	console.log("Rendering articles list");

	return (
		<div className="article-list">
			{articles.map((article) => {
				return <Article key={"article-" + article.data.id} articleInfo={article} />;
			})}
			<button className="create-article" onClick={console.log}>
				Artikel hinzufügen
			</button>
		</div>
	);
}

export default ArticlesList;
