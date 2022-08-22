import React from "react";
import { Article as ArticleModel } from "shared/src/models/article";

function Article({ article }: { article: ArticleModel }) {
	const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

	const [hasChanges, setHasChanges] = React.useState(false);

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

			{article.prices.map((price, index) => {
				const mwst = (100 + article.mwst) / 100.0;

				return (
					<React.Fragment key={"article-" + article.name + "-" + index}>
						<div>{weekdays[index]}</div>
						<input
							type="number"
							name="mwst"
							id="mwst-input"
							className="article-input"
							defaultValue={article.mwst}
							onChange={(evt) => {
								setHasChanges(true);
							}}
						/>
						<input
							type="number"
							name="sell"
							id="sell-input"
							className="article-input"
							defaultValue={price.sell}
							onChange={(evt) => {
								setHasChanges(true);
							}}
						/>
						<div style={{ gridColumn: "span 2" }}>0,{price.sell * mwst}€</div>
						<input
							type="number"
							name="sell"
							id="purchase-input"
							className="article-input"
							defaultValue={price.purchase}
							onChange={(evt) => {
								setHasChanges(true);
							}}
						/>
						<div>0,{price.purchase * mwst}€</div>
					</React.Fragment>
				);
			})}

			{hasChanges && (
				<button
					style={{ gridColumnStart: "7" }}
					onClick={(evt) => {
						setHasChanges(false);
					}}
				>
					Speichern
				</button>
			)}
		</div>
	);
}

export default Article;
