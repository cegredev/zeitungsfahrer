import { ArticleRecords, Record, VendorRecords } from "backend/src/models/records.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { useImmer } from "use-immer";
import { GET, POST } from "../api";
import { calculateTotalValueBrutto, normalizeDate, twoDecimalsFormat, weekdays } from "../consts";
import { updateArticleRecordsAtom, vendorRecordsAtom } from "../stores/records.store";
import { authTokenAtom } from "../stores/utility.store";
import LoadingPlaceholder from "./util/LoadingPlaceholder";
import YesNoPrompt from "./util/YesNoPrompt";

const todayNormalized = normalizeDate(new Date());

export interface GUIRecord extends Record {
	editable: boolean;
	edited: boolean;
	inFuture: boolean;
}

interface GUIArticleRecords extends ArticleRecords {
	records: GUIRecord[];
}

interface Props {
	vendorId: number;
	articleId: number;
	date: Date;
}

// enum RecordState {
// 	MISSING, COMPLETE,
// }

function StateDisplay({ record }: { record: GUIRecord }): JSX.Element {
	// if (record.edited) {
	// 	return <span style={{ color: "black" }}>Bearbeitet</span>;
	// }

	if (record.missing) {
		if (record.inFuture) {
			return <span style={{ color: "black" }}>Ausstehend</span>;
		}

		return <span style={{ color: "red" }}>Fehlt</span>;
	}

	return <span style={{ color: "green" }}>Vollständig</span>;
}

function ArticleRecordsItem({ vendorId, articleId, date }: Props) {
	const [vendorRecords] = useAtom(vendorRecordsAtom);
	const [, updateRecords] = useAtom(updateArticleRecordsAtom);

	const [token] = useAtom(authTokenAtom);

	const [records, setRecords] = useImmer<GUIArticleRecords | undefined>(undefined);

	React.useEffect(() => {
		async function fetchData() {
			const response = await GET(
				"/auth/records/" + vendorId + "?articleId=" + articleId + "&end=" + dayjs(date).format("YYYY-MM-DD"),
				token!
			);
			const data: ArticleRecords = await response.json();

			console.log(data);

			const articleRecords = {
				...data,
				start: new Date(data.start),
				records: data.records.map((r) => {
					const time = normalizeDate(r.date).getTime();
					const inFuture = time > todayNormalized.getTime();
					const isToday = time === todayNormalized.getTime();

					return {
						...r,
						editable: isToday || (r.missing && !inFuture),
						edited: isToday,
						inFuture,
					};
				}),
			};

			setRecords(articleRecords);
		}

		fetchData();
	}, [setRecords, token]);

	const startDate = records?.start;
	const weekdayOffset = startDate ? (6 + startDate.getUTCDay()) % 7 : 0; // Sunday is 0 instead of Monday
	const totalValueBrutto = records ? calculateTotalValueBrutto(records.records) : 0;
	return (
		<React.Fragment>
			{records === undefined ? (
				<LoadingPlaceholder />
			) : (
				<div className="vendor-week-entry">
					<h3>{records.name}</h3>
					<div className="solid-divider" />
					<table className="vendor-table">
						{/* Headers */}
						<thead>
							<tr>
								<th />
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
										style={{
											backgroundColor: record.edited
												? "#8bcc81"
												: !record.editable && (!record.missing || record.inFuture)
												? "darkgray"
												: "inherit",
											color: record.editable ? "inherit" : "gray",
										}}
									>
										<td>
											<input
												type="checkbox"
												style={{ accentColor: "gray" }}
												checked={record.editable}
												onChange={() => {
													const newRecords = [...records.records];
													newRecords[i] = {
														...record,
														editable: !record.editable,
													};
													updateRecords({
														...records,
														records: newRecords,
													});
												}}
											/>
										</td>
										<td>{date}</td>
										<td>{weekdays[weekday]}</td>
										<td>
											<input
												type="number"
												className="article-input"
												min={record.remissions}
												value={record.supply}
												disabled={!record.editable}
												onChange={(evt) => {
													const newRecords = [...records.records];
													newRecords[i] = {
														...record,
														supply: parseInt(evt.target.value),
														edited: true,
													};
													updateRecords({ ...records, records: newRecords });
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
												disabled={!record.editable}
												onChange={(evt) => {
													const newRecords = [...records.records];
													newRecords[i] = {
														...record,
														remissions: parseInt(evt.target.value),
														edited: true,
													};
													updateRecords({ ...records, records: newRecords });
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
								<td />
								<td>
									<YesNoPrompt
										trigger={<button style={{ color: "green", float: "left" }}>Speichern</button>}
										header="Speichern"
										content={`Wollen Sie das gewählte Element wirklich speichern?`}
										onYes={async () => {
											await POST(
												`/auth/records/${vendorId}`,
												{ ...records, records: records.records.filter((r) => r.edited) },
												token!
											);
											updateRecords({
												...records,
												records: records.records.map((r) => ({
													...r,
													missing: !(r.edited || !r.missing),
													edited: false,
													editable: r.edited ? false : r.editable,
												})),
											});
										}}
									/>
								</td>
								<td colSpan={4} />
								<td style={{ fontWeight: "bold" }}>
									{twoDecimalsFormat.format(
										records.records
											.map((r) => (!r.missing ? r.price.sell * (r.supply - r.remissions) : 0))
											.reduce((a, b) => a + b, 0)
									)}
								</td>
								<td style={{ fontWeight: "bold" }}> {twoDecimalsFormat.format(totalValueBrutto)}</td>
							</tr>
						</tbody>
					</table>
				</div>
			)}
		</React.Fragment>
	);
}

export default ArticleRecordsItem;
