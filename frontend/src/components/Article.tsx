import { useAtom } from "jotai";
import React from "react";
import { Article as ArticleInfo } from "backend/src/models/article.model";
import { finishArticleAtom, removeArticleAtom, updateArticleAtom, cancelDraftAtom } from "../store";
import { DELETE, POST, PUT } from "../api";
import ArticleInput from "./ArticleInput";
import Popup from "reactjs-popup";
import YesNoPrompt from "./util/YesNoPrompt";

const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const twoDecimalsFormat = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 2,
});

function Article({ articleInfo }: { articleInfo: ArticleInfo }) {
	const [article, setArticle] = React.useState({ id: articleInfo.id, name: articleInfo.name });
	const [prices, setPrices] = React.useState(articleInfo.prices);

	const [, updateArticle] = useAtom(updateArticleAtom);
	const [, removeArticle] = useAtom(removeArticleAtom);
	const [, finishArticle] = useAtom(finishArticleAtom);
	const [, cancelDraft] = useAtom(cancelDraftAtom);

	const isDraft = article.id == null;
	const cancelText = isDraft ? "Verwerfen" : "Löschen";
	const saveText = isDraft ? "Hinzufügen" : "Speichern";

	return (
		<div className="article">
			<div style={{ gridColumn: "span 2" }}>
				<ArticleInput
					type="text"
					style={{ minWidth: "90%" }}
					defaultValue={article.name}
					onChange={(evt) => {
						setArticle({ ...article, name: evt.target.value });
					}}
				/>
			</div>
			<div style={{ gridColumn: "span 3" }}>
				<strong>Einkaufspreis</strong>
				{isDraft && <span style={{ color: "red", fontWeight: "bold" }}> (Entwurf)</span>}
			</div>
			<div style={{ gridColumn: "span 3" }}>
				<strong>Verkaufspreis</strong>
			</div>
			<div style={{ gridColumn: "span 2" }}>
				<strong>Marktpreis</strong>
			</div>
			<div style={{ gridColumnStart: "2" }}>MwSt</div>
			<div>Netto</div>
			<div style={{ gridColumn: "span 2", textAlign: "left" }}>Brutto</div>
			<div>Netto</div>
			<div style={{ gridColumn: "span 2", textAlign: "left" }}>Brutto</div>
			<div>Netto</div>
			<div>Brutto</div>
			{prices.map((price, index) => {
				const mwst = (100 + price.mwst) / 100.0;

				return (
					<React.Fragment key={"article-" + article.name + "-" + index}>
						<div>{weekdays[index]}</div>

						{/* Mwst */}
						<div style={{ display: "block" }}>
							<ArticleInput
								type="number"
								defaultValue={price.mwst}
								onChange={(evt) => {
									prices[index] = { ...prices[index], mwst: parseInt(evt.target.value) };
									setPrices([...prices]);
								}}
							/>
							%
						</div>

						{/* Sell price */}
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
						<div style={{ gridColumn: "span 2" }}>{twoDecimalsFormat.format(price.purchase * mwst)}</div>

						{/*  Purchase price */}
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
							€
						</div>
						<div style={{ gridColumn: "span 2" }}>{twoDecimalsFormat.format(price.sell * mwst)}</div>

						{/*  Purchase price */}
						<div style={{ display: "block" }}>
							<ArticleInput
								type="number"
								defaultValue={price.sellTrader}
								step={0.0001}
								onChange={(evt) => {
									prices[index] = { ...prices[index], sellTrader: parseFloat(evt.target.value) };
									setPrices([...prices]);
								}}
							/>
							€
						</div>
						<div>{twoDecimalsFormat.format(price.sellTrader * mwst)}</div>
					</React.Fragment>
				);
			})}

			<YesNoPrompt
				trigger={<button style={{ color: "red" }}>{cancelText}</button>}
				header={cancelText}
				content={`Wollen Sie das gewählte Element wirklich ${cancelText.toLowerCase()}?`}
				onYes={async () => {
					if (article.id == null) {
						cancelDraft();
					} else {
						await DELETE("articles", { id: article.id });
						removeArticle(article.id!);
					}
				}}
			/>

			<YesNoPrompt
				trigger={<button style={{ color: "green", gridColumnStart: 10 }}>{saveText}</button>}
				header={saveText}
				content={`Wollen Sie das gewählte Element wirklich ${saveText.toLowerCase()}?`}
				onYes={async () => {
					let info = { ...article, prices };

					if (isDraft) {
						const res = await POST("articles", info);

						if (res.ok) {
							const body = await res.json();

							info.id = body.id;

							setArticle({ ...article, id: info.id });
							finishArticle(info);
						} else {
							console.error(res);
						}
					} else {
						await PUT("articles", info);
					}

					updateArticle(info);
				}}
			/>
		</div>
	);
}

export default Article;
