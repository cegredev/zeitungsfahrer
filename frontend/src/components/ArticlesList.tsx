import React from "react";
import { Article as ArticleModel } from "shared/src/models/article";
import Article from "./Article";

function ArticlesList({ articles }: { articles: ArticleModel[] }) {
	return (
		<div className="article-list">
			{articles.map((article) => {
				return <Article key={"article-" + article.id} article={article} />;
			})}
			<button className="create-article" onClick={console.log}>
				Artikel hinzufügen
			</button>
		</div>
	);
}

export default ArticlesList;
