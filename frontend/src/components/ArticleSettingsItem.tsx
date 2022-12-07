import { useAtom } from "jotai";
import React from "react";
import { Article } from "backend/src/models/articles.model";
import {
	finishArticleAtom,
	removeArticleAtom,
	updateArticleAtom,
	cancelArticleDraftAtom,
} from "../stores/article.store";
import { DELETE, POST, PUT } from "../api";
import YesNoPrompt from "./util/YesNoPrompt";

import { weekdays } from "../consts";
import dayjs from "dayjs";
import { authTokenAtom, errorMessageAtom } from "../stores/utility.store";
import NumberInput from "./util/NumberInput";
import Big from "big.js";

const twoDecimalsFormat = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 2,
});

const gridSpan2: React.CSSProperties = {
	gridColumn: "span 2",
};
const gridSpan2Left: React.CSSProperties = {
	...gridSpan2,
	textAlign: "left",
};
const gridSpan3: React.CSSProperties = {
	gridColumn: "span 3",
};

function commaFloatParse(input: string): number {
	return parseFloat(input.replace(",", "."));
}

function ArticleSettingsItem({ articleInfo }: { articleInfo: Article }) {
	const [article, setArticle] = React.useState({ id: articleInfo.id, name: articleInfo.name });
	const [prices, setPrices] = React.useState(articleInfo.prices);

	const [, updateArticle] = useAtom(updateArticleAtom);
	const [, removeArticle] = useAtom(removeArticleAtom);
	const [, finishArticle] = useAtom(finishArticleAtom);
	const [, cancelDraft] = useAtom(cancelArticleDraftAtom);
	const [, setErrorMessage] = useAtom(errorMessageAtom);
	const [token] = useAtom(authTokenAtom);

	const isDraft = article.id == null;
	const cancelText = isDraft ? "Verwerfen" : "Löschen";
	const saveText = isDraft ? "Hinzufügen" : "Speichern";

	return (
		<div className="article" style={{ minWidth: 700 }}>
			<div style={gridSpan2}>
				<input
					type="text"
					className="article-input"
					style={{ minWidth: "90%" }}
					defaultValue={article.name}
					onChange={(evt) => {
						setArticle({ ...article, name: evt.target.value });
					}}
				/>
			</div>
			<div style={{ gridColumn: "4 / 7" }}>
				<strong>Einkaufspreis</strong>
				{isDraft && <span style={{ color: "red", fontWeight: "bold" }}> (Entwurf)</span>}
			</div>
			<div style={gridSpan3}>
				<strong>Verkaufspreis</strong>
			</div>
			<div style={gridSpan2}>
				<strong>Warenwert</strong>
			</div>

			<div style={{ gridColumn: "2 / 4" }}>MwSt</div>
			<div>Netto</div>
			<div style={gridSpan2Left}>Brutto</div>
			<div>Netto</div>
			<div style={gridSpan2Left}>Brutto</div>
			<div>Netto</div>
			<div>Brutto</div>
			{prices.map((price, index) => {
				const mwst = (100 + price.mwst) / 100.0;

				return (
					<React.Fragment key={index}>
						<div>{weekdays[index]}</div>

						{/* Mwst */}
						<div className="display-block" style={{ ...gridSpan2, whiteSpace: "nowrap" }}>
							<NumberInput
								min={0}
								max={100}
								className="article-input"
								customProps={{
									parse: parseInt,
									startValue: price.mwst,
									filter: (value) => {
										prices[index] = { ...prices[index], mwst: value };
										setPrices([...prices]);
									},
								}}
							/>
							%
						</div>

						{/* Purchase price */}
						<div className="display-block" style={{ whiteSpace: "nowrap" }}>
							<NumberInput
								className="article-input"
								min={0}
								step={0.0001}
								customProps={{
									parse: commaFloatParse,
									allowDecimals: true,
									startValue: price.purchase.toNumber(),
									filter: (value) => {
										prices[index] = { ...prices[index], purchase: Big(value) };
										setPrices([...prices]);
									},
								}}
							/>
							€
						</div>
						<div style={gridSpan2}>{twoDecimalsFormat.format(price.purchase.mul(mwst).toNumber())}</div>

						{/*  Sell price */}
						<div className="display-block" style={{ whiteSpace: "nowrap" }}>
							<NumberInput
								className="article-input"
								step={0.0001}
								customProps={{
									parse: commaFloatParse,
									allowDecimals: true,
									startValue: price.sell.toNumber(),
									filter: (value) => {
										prices[index] = { ...prices[index], sell: Big(value) };
										setPrices([...prices]);
									},
								}}
							/>
							€
						</div>
						<div style={gridSpan2}>{twoDecimalsFormat.format(price.sell.mul(mwst).toNumber())}</div>

						{/*  Market-sell price */}
						<div className="display-block" style={{ whiteSpace: "nowrap" }}>
							<NumberInput
								className="article-input"
								step={0.0001}
								customProps={{
									parse: commaFloatParse,
									allowDecimals: true,
									startValue: price.marketSell.toNumber(),
									filter: (value) => {
										prices[index] = { ...prices[index], marketSell: Big(value) };
										setPrices([...prices]);
									},
								}}
							/>
							€
						</div>
						<div>{twoDecimalsFormat.format(price.marketSell.mul(mwst).toNumber())}</div>
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
						await DELETE("/auth/main/articles/" + article.id, token!);
						removeArticle(article.id!);
					}
				}}
			/>

			<YesNoPrompt
				trigger={<button style={{ color: "green", gridColumnStart: 11 }}>{saveText}</button>}
				header={saveText}
				content={`Wollen Sie das gewählte Element wirklich ${saveText.toLowerCase()}?`}
				onYes={async () => {
					let info = { ...article, prices };

					if (isDraft) {
						try {
							const res = await POST<{ id: number }>(
								"/auth/main/articles",
								{ ...info, startDate: new Date() },
								token!
							);

							info.id = res.data.id;

							setArticle({ ...article, id: info.id });
							finishArticle(info);
						} catch (error) {
							console.error(error);

							// setErrorMessage(body.userMessage);
						}
					} else {
						await PUT(
							"/auth/main/articles",
							{
								startDate: dayjs(new Date()).format("YYYY-MM-DD"),
								article: info,
							},
							token!
						);
					}

					updateArticle(info);
				}}
			/>
		</div>
	);
}

export default ArticleSettingsItem;
