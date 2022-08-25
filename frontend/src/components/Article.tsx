import { useAtom } from "jotai";
import React from "react";
import { ArticleInfo } from "shared/src/models/article";
import { finishArticleAtom, removeArticleAtom, updateArticleAtom, cancelDraftAtom } from "../store";
import { DELETE, POST, PUT } from "../api";
import ArticleInput from "./ArticleInput";

const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const twoDecimalsFormat = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 2,
});

function Article({ articleInfo }: { articleInfo: ArticleInfo }) {
	const [article, setArticle] = React.useState(articleInfo.data);
	const [, updateArticle] = useAtom(updateArticleAtom);
	const [prices, setPrices] = React.useState(articleInfo.prices);
	const [, removeArticle] = useAtom(removeArticleAtom);
	const [, finishArticle] = useAtom(finishArticleAtom);
	const [, cancelDraft] = useAtom(cancelDraftAtom);

	const isDraft = article.id == null;

	return (
		<div className="article">
			<div style={{ gridColumn: "span 5" }}>
				{isDraft && <span style={{ color: "red", fontWeight: "bold" }}>(Entwurf) </span>}
				<strong>Verkaufspreis</strong>
			</div>
			<div style={{ gridColumn: "span 2" }}>
				<strong>Einkaufspreis</strong>
			</div>

			<ArticleInput
				type="text"
				style={{ maxWidth: "100px" }}
				defaultValue={article.name}
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

						{/* Mwst */}
						<div style={{ display: "block" }}>
							<ArticleInput
								type="number"
								defaultValue={article.mwst}
								onChange={(evt) => {
									setArticle({ ...article, mwst: parseInt(evt.target.value) });
								}}
							/>
							%
						</div>

						{/* Sell price */}
						<div style={{ display: "block" }}>
							<ArticleInput
								type="number"
								defaultValue={price.sell}
								step={0.0001}
								onChange={(evt) => {
									prices[index] = { ...prices[index], sell: parseFloat(evt.target.value) };
									setPrices([...prices]);
								}}
							/>
						</div>
						<div style={{ gridColumn: "span 2" }}>{twoDecimalsFormat.format(price.sell * mwst)}</div>

						{/*  Purchase price */}
						<div style={{ display: "block" }}>
							<ArticleInput
								type="number"
								defaultValue={price.purchase}
								step={0.0001}
								onChange={(evt) => {
									prices[index] = { ...prices[index], purchase: parseFloat(evt.target.value) };
									setPrices([...prices]);
								}}
							/>
							€
						</div>
						<div>{twoDecimalsFormat.format(price.purchase * mwst)}</div>
					</React.Fragment>
				);
			})}

			<button
				style={{ color: "red" }}
				onClick={async () => {
					if (article.id == null) {
						cancelDraft();
					} else {
						await DELETE("articles", { id: article.id });

						removeArticle(article.id!);
					}
				}}
			>
				{isDraft ? "Abbrechen" : "Löschen"}
			</button>

			<button
				style={{ gridColumnStart: "7", color: "green" }}
				onClick={async () => {
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
		</div>
	);
}

export default Article;
