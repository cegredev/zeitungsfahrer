import { useAtom } from "jotai";
import React from "react";
import { ArticleInfo } from "shared/src/models/article";
import { finishArticleAtom, removeArticleAtom, updateArticleAtom } from "../store";
import { DELETE, POST, PUT } from "../api";

const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function Article({ articleInfo }: { articleInfo: ArticleInfo }) {
	const [article, setArticle] = React.useState(articleInfo.data);
	const [, updateArticle] = useAtom(updateArticleAtom);
	const [prices, setPrices] = React.useState(articleInfo.prices);
	const [, removeArticle] = useAtom(removeArticleAtom);
	const [, finishArticle] = useAtom(finishArticleAtom);

	const isDraft = article.id == null;

	return (
		<div className="article">
			<div style={{ gridColumn: "span 5" }}>{isDraft && "(Entwurf) "}Verkaufspreis</div>
			<div style={{ gridColumn: "span 2" }}>Einkaufspreis</div>

			<input
				type="text"
				className="article-input"
				style={{ maxWidth: "100px" }}
				value={article.name}
				onChange={(evt) => {
					setArticle({ ...article, name: evt.target.value });
				}}
			/>
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

			<button
				onClick={async (evt) => {
					await DELETE("articles", { id: article.id });

					removeArticle(article.id!);
				}}
			>
				{isDraft ? "Abbrechen" : "Löschen"}
			</button>

			{(isDraft || articleInfo.data !== article || articleInfo.prices !== prices) && (
				<button
					style={{ gridColumnStart: "7" }}
					onClick={async (evt) => {
						let info = { data: article, prices };

						if (isDraft) {
							const res = await POST("articles", info);
							if (res.ok) {
								const body = await res.json();
								const id = body.id;

								info = { data: { ...info.data, id }, prices: info.prices };

								setArticle({ ...article, id });
								finishArticle(info);
							} else {
								console.error(res);
							}
						} else {
							await PUT("articles", info);
						}

						updateArticle(info);
					}}
				>
					{isDraft ? "Hinzufügen" : "Speichern"}
				</button>
			)}
		</div>
	);
}

export default Article;
