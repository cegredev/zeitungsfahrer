import { useAtom } from "jotai";
import React from "react";
import { articlesListAtom } from "../store";
import Article from "./Article";

function ArticlesList() {
	const [articleIds] = useAtom(articlesListAtom);

	console.log("Rendering articles list");

	return (
		<div className="article-list">
			{articleIds.map((article) => {
				return <Article key={"article-" + article.data.id} articleInfo={article} />;
			})}
			<button className="create-article" onClick={console.log}>
				Artikel hinzufügen
			</button>
		</div>
	);
}

export default ArticlesList;
