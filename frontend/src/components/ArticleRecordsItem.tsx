import { ArticleRecords } from "backend/src/models/records.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { POST } from "../api";
import { twoDecimalsFormat, weekdays } from "../consts";
import { authTokenAtom } from "./stores/utility.store";
import YesNoPrompt from "./util/YesNoPrompt";

interface Props {
	vendorId: number;
	_records: ArticleRecords;
}

function ArticleRecordsItem({ vendorId, _records }: Props) {
	const [records, setRecords] = React.useState(_records);
	const [token] = useAtom(authTokenAtom);

	const startDate = React.useMemo(() => new Date(records.start), [records.start]);
	const weekdayOffset = (6 + startDate.getUTCDay()) % 7; // Sunday is 0 instead of Monday

	return (
		<div className="vendor-week-entry">
			<h3>{records.name}</h3>
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
				{records.records.map((record, i) => {
					const weekday = (i + weekdayOffset) % 7;
					const date = dayjs(startDate).add(i, "day").format("DD.MM.YYYY");
					const soldAmount = record.supply - record.remissions;

					return (
						<React.Fragment key={"sales-" + records.id + "-" + i}>
							<div>{date}</div>
							<div>{weekdays[weekday]}</div>
							<div className="centering-div">
								<input
									type="number"
									className="article-input"
									min={record.remissions}
									value={record.supply}
									onChange={(evt) => {
										const newRecords = [...records.records];
										newRecords[i] = {
											...record,
											supply: parseInt(evt.target.value),
										};
										setRecords({ ...records, records: newRecords });
									}}
								/>
							</div>
							<div className="centering-div">
								<input
									type="number"
									className="article-input"
									min={0}
									max={record.supply}
									value={record.remissions}
									onChange={(evt) => {
										const newRecords = [...records.records];
										newRecords[i] = {
											...record,
											remissions: parseInt(evt.target.value),
										};
										setRecords({ ...records, records: newRecords });
									}}
								/>
							</div>
							<div>{soldAmount}</div>
							<div>{twoDecimalsFormat.format(soldAmount * record.price.sell)}</div>
							<div>
								{twoDecimalsFormat.format(
									(soldAmount * record.price.sell * (100 + record.price.mwst)) / 100
								)}
							</div>
						</React.Fragment>
					);
				})}

				<YesNoPrompt
					trigger={<button style={{ color: "green" }}>Speichern</button>}
					header="Speichern"
					content={`Wollen Sie das gewählte Element wirklich speichern?`}
					onYes={() => {
						POST(`/auth/records/${vendorId}`, records, token!);
					}}
				/>

				<div style={{ gridColumnStart: 6, fontWeight: "bold" }}>
					{twoDecimalsFormat.format(records.totalValueNetto)}
				</div>
				<div style={{ fontWeight: "bold" }}>{twoDecimalsFormat.format(records.totalValueBrutto)}</div>
			</div>
		</div>
	);
}

export default ArticleRecordsItem;
