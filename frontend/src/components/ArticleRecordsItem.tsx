import { ArticleRecords, Record } from "backend/src/models/records.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { POST } from "../api";
import { normalizeDate, twoDecimalsFormat, weekdays } from "../consts";
import { authTokenAtom } from "./stores/utility.store";
import YesNoPrompt from "./util/YesNoPrompt";

interface Props {
	vendorId: number;
	_records: ArticleRecords;
}

// enum RecordState {
// 	MISSING, COMPLETE,
// }

function StateDisplay({ record }: { record: Record }): JSX.Element {
	if (record.missing) {
		if (normalizeDate(new Date()).getTime() < normalizeDate(record.date).getTime()) {
			return <span style={{ color: "#666666" }}>In Zukunft</span>;
		}

		return <span style={{ color: "red" }}>Fehlt</span>;
	}

	return <span style={{ color: "green" }}>Vollständig</span>;
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

			<table className="vendor-table">
				{/* Headers */}
				<thead>
					<tr>
						<th>Datum</th>
						<th>Ausgabe</th>
						<th>Lieferung</th>
						<th>Remission</th>
						<th>Verkauf</th>
						<th>Betrag Netto</th>
						<th>Betrag Brutto</th>
						<th>Status</th>
					</tr>
				</thead>
				{/* Data */}
				<tbody>
					{records.records.map((record, i) => {
						const weekday = (i + weekdayOffset) % 7;
						const date = dayjs(startDate).add(i, "day").format("DD.MM.YYYY");
						const soldAmount = record.supply - record.remissions;
						return (
							<tr
								key={"sales-" + records.id + "-" + i}
								style={{ backgroundColor: record.missing ? "inherit" : "darkgray" }}
							>
								<td>{date}</td>
								<td>{weekdays[weekday]}</td>
								<td>
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
								</td>
								<td>
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
								</td>
								<td>{soldAmount}</td>
								<td>{twoDecimalsFormat.format(soldAmount * record.price.sell)}</td>
								<td>
									{twoDecimalsFormat.format(
										(soldAmount * record.price.sell * (100 + record.price.mwst)) / 100
									)}
								</td>
								<td>
									<StateDisplay record={record} />
								</td>
							</tr>
						);
					})}
					<tr>
						<td>
							<YesNoPrompt
								trigger={<button style={{ color: "green", float: "left" }}>Speichern</button>}
								header="Speichern"
								content={`Wollen Sie das gewählte Element wirklich speichern?`}
								onYes={async () => {
									setRecords({
										...records,
										records: records.records.map((r) => ({ ...r, missing: false })),
									});
									await POST(`/auth/records/${vendorId}`, records, token!);
								}}
							/>
						</td>
						<td colSpan={4} />
						<td style={{ fontWeight: "bold" }}>
							{twoDecimalsFormat.format(
								records.records
									.map((r) => r.price.sell * (r.supply - r.remissions))
									.reduce((a, b) => a + b, 0)
							)}
						</td>
						<td style={{ fontWeight: "bold" }}>
							{" "}
							{twoDecimalsFormat.format(
								records.records
									.map((r) => r.price.sell * (r.supply - r.remissions) * ((100 + r.price.mwst) / 100))
									.reduce((a, b) => a + b, 0)
							)}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}

export default ArticleRecordsItem;
