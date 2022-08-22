import { atom, useAtom } from "jotai";
import React from "react";
import { ArticleInfo } from "shared/src/models/article";
import { updateArticleTodo } from "../store";

function Article({ articleInfo }: { articleInfo: ArticleInfo }) {
	const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

	const [article, setArticle] = React.useState(articleInfo.data);
	const [, updateArticle] = useAtom(updateArticleTodo);

	const [prices, setPrices] = React.useState(articleInfo.prices);

	console.log("Rendering article", article.id);

	console.log("article info", article, article, article === article);

	if (article == undefined) {
		return <div>Article missing</div>;
	}

	return (
		<div className="article">
			<div style={{ gridColumn: "span 5" }}>Verkaufspreis</div>
			<div style={{ gridColumn: "span 2" }}>Einkaufspreis</div>

			<div>{article.name}</div>
			<div>MwSt</div>
			<div>Netto</div>
			<div style={{ gridColumn: "span 2", textAlign: "left" }}>Brutto</div>
			<div>Netto</div>
			<div>Brutto</div>

			{prices.map((price, index) => {
				const mwst = (100 + article.mwst) / 100.0;

				return (
					<React.Fragment key={"article-" + article.name + "-" + index}>
						<div>{weekdays[index]}</div>
						<div style={{ display: "block" }}>
							<input
								type="number"
								name="mwst"
								id="mwst-input"
								className="article-input"
								value={article.mwst}
								onChange={(evt) => {
									setArticle({ ...article, mwst: parseInt(evt.target.value) });
								}}
							/>
							%
						</div>
						<div style={{ display: "block" }}>
							<input
								type="number"
								name="sell"
								id="sell-input"
								className="article-input"
								defaultValue={price.sell}
								onChange={(evt) => {
									prices[index] = { ...prices[index], sell: parseInt(evt.target.value) };
									setPrices([...prices]);
								}}
							/>
							€
						</div>
						<div style={{ gridColumn: "span 2" }}>0,{price.sell * mwst}€</div>
						<div style={{ display: "block" }}>
							<input
								type="number"
								name="sell"
								id="purchase-input"
								className="article-input"
								defaultValue={price.purchase}
								onChange={(evt) => {
									prices[index] = { ...prices[index], purchase: parseInt(evt.target.value) };
									setPrices([...prices]);
								}}
							/>
							€
						</div>
						<div>0,{price.purchase * mwst}€</div>
					</React.Fragment>
				);
			})}

			{(articleInfo.data !== article || articleInfo.prices !== prices) && (
				<button
					style={{ gridColumnStart: "7" }}
					onClick={(evt) => {
						updateArticle({ data: article, prices });
					}}
				>
					Speichern
				</button>
			)}
		</div>
	);
}

export default Article;
