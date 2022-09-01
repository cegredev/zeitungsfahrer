import { ArticleWeek } from "backend/src/models/vendor.model";
import dayjs from "dayjs";
import React from "react";
import { twoDecimalsFormat, weekdays } from "../consts";
import YesNoPrompt from "./util/YesNoPrompt";

interface Props {
	articleWeek: ArticleWeek;
}

function VendorWeekEntry({ articleWeek }: Props) {
	console.log("week:", articleWeek);

	const [allDays, setAllDays] = React.useState(articleWeek.days);

	const startDate = React.useMemo(() => new Date(articleWeek.start), [articleWeek.start]);
	const weekdayOffset = (6 + startDate.getUTCDay()) % 7; // Sunday is 0 instead of Monday

	return (
		<div className="vendor-week-entry">
			<h3>{articleWeek.name}</h3>
			<div className="solid-divider" />

			<div className="vendor-table">
				{/* Headers */}
				<>
					<div>Datum</div>
					<div>Ausgabe</div>
					<div>Lieferung</div>
					<div>Remission</div>
					<div>Verkauf</div>
					<div>Betrag Netto</div>
					<div>Betrag Brutto</div>
				</>
				{/* Data */}
				{allDays.map((sellingDay, i) => {
					const weekday = (i + weekdayOffset) % 7;
					const date = dayjs(startDate).add(i, "day").format("DD.MM.YYYY");

					return (
						<React.Fragment key={"sales-" + articleWeek.id + "-" + i}>
							<div>{date}</div>
							<div>{weekdays[weekday]}</div>
							<div>{sellingDay.remissions + sellingDay.sales}</div>
							{/* <div>{sales.remissions}</div> */}
							<div className="centering-div">
								<input
									type="number"
									className="article-input"
									min={0}
									value={sellingDay.remissions}
									onChange={(evt) => {
										const newAllDays = [...allDays];
										newAllDays[i] = {
											...sellingDay,
											remissions: parseInt(evt.target.value),
										};
										setAllDays(newAllDays);
									}}
								/>
							</div>
							<div className="centering-div">
								<input
									type="number"
									className="article-input"
									// style={{ maxWidth: "100%" }}
									min={0}
									value={sellingDay.sales}
									onChange={(evt) => {
										const newAllSales = [...allDays];
										newAllSales[i] = {
											...sellingDay,
											sales: parseInt(evt.target.value),
										};
										setAllDays(newAllSales);
									}}
								/>
							</div>
							<div>{sellingDay.price.sell}</div>
							<div>
								{twoDecimalsFormat.format(
									(sellingDay.price.sell * (100 + sellingDay.price.mwst)) / 100
								)}
							</div>
						</React.Fragment>
					);
				})}

				<YesNoPrompt
					trigger={<button style={{ color: "green", gridColumnStart: 7 }}>Speichern</button>}
					header="Speichern"
					content={`Wollen Sie das gewählte Element wirklich speichern?`}
					onYes={() => {
						// updateWeek({ ...week, sales: allSales });
						// POST
					}}
				/>
			</div>
		</div>
	);
}

export default VendorWeekEntry;
