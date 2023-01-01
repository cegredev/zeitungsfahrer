import { ArticleRecords, Record } from "backend/src/models/records.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { Updater } from "use-immer";
import { GET } from "../api";
import { calculateTotalValueBrutto, normalizeDate, twoDecimalsFormat, weekdays } from "../consts";
import { ChangedRecord } from "backend/src/models/records.model";
import { authTokenAtom, userInfoAtom } from "../stores/utility.store";
import LoadingPlaceholder from "./util/LoadingPlaceholder";
import NumberInput from "./util/NumberInput";
import Big from "big.js";

const todayNormalized = normalizeDate(new Date());

export interface GUIRecord extends Record {
	editable: boolean;
	edited: boolean;
	inFuture: boolean;
}

export interface GUIArticleRecords extends ArticleRecords {
	records: GUIRecord[];
}

interface Props {
	vendorId: number;
	articleId: number;
	date: Date;
	recordsMap: Map<number, GUIArticleRecords>;
	setRecords: Updater<Map<number, GUIArticleRecords>>;
	addChangedRecord: (r: ChangedRecord) => void;
}

function StateDisplay({ record }: { record: GUIRecord }): JSX.Element {
	if (record.missing) {
		if (record.inFuture) {
			return <span style={{ color: "black" }}>Ausstehend</span>;
		}

		return <span style={{ color: "red" }}>Fehlt</span>;
	}

	return <span style={{ color: "green" }}>Vollständig</span>;
}

function ArticleRecordsItem({ vendorId, articleId, date, recordsMap, setRecords, addChangedRecord }: Props) {
	const [userInfo] = useAtom(userInfoAtom);

	const records = recordsMap.get(articleId);

	React.useEffect(() => {
		async function fetchData() {
			const response = await GET<ArticleRecords>(
				`/auth/${userInfo!.role}/records/${vendorId}?articleId=${articleId}&end=${dayjs(date).format(
					"YYYY-MM-DD"
				)}`,
				userInfo!.token
			);
			const data = response.data;

			const articleRecords = {
				...data,
				start: new Date(data.start),
				records: data.records.map((r) => {
					const date = new Date(r.date);
					const time = normalizeDate(date).getTime();
					const inFuture = time > todayNormalized.getTime();
					const isToday = time === todayNormalized.getTime();

					if (isToday) addChangedRecord({ ...r, date, articleId });

					return {
						...r,
						date,
						editable: isToday || (r.missing! && !inFuture),
						edited: isToday,
						inFuture,
						price: {
							...r.price!,
							purchase: Big(r.price!.purchase),
							sell: Big(r.price!.sell),
							marketSell: Big(r.price!.marketSell),
						},
					};
				}),
			};

			setRecords((draft) => draft.set(articleId, articleRecords));
		}

		fetchData();
	}, [setRecords, date, articleId, vendorId, userInfo, addChangedRecord]);

	const updateField = React.useCallback(
		(recordIndex: number, update: (r: GUIRecord) => void) => {
			setRecords((draft) => {
				const record = draft!.get(articleId)!.records[recordIndex];
				update(record);
				record.edited = true;

				addChangedRecord({ ...record, articleId });
			});
		},
		[setRecords, addChangedRecord, articleId]
	);

	const startDate = records?.start;
	const weekdayOffset = startDate ? (6 + startDate.getDay()) % 7 : 0; // Sunday is 0 instead of Monday
	const totalValueBrutto = calculateTotalValueBrutto(records?.records || []);
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
							{records.records.map((record, recordIndex) => {
								const weekday = (recordIndex + weekdayOffset) % 7;
								const date = dayjs(startDate).add(recordIndex, "day").format("DD.MM.YYYY");
								const soldAmount = record.supply - record.remissions;

								if (record.edited) console.log(record);

								return (
									<tr
										key={"sales-" + records.start.getTime() + "-" + records.id + "-" + recordIndex}
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
												onChange={() =>
													setRecords((draft) => {
														draft!.get(articleId)!.records[recordIndex].editable =
															!record.editable || record.edited;
													})
												}
											/>
										</td>
										<td>{date}</td>
										<td>{weekdays[weekday]}</td>
										<td>
											<NumberInput
												className="article-input"
												disabled={!record.editable}
												min={0}
												customProps={{
													parse: parseInt,
													startValue: record.supply,
													filter: (input) =>
														updateField(recordIndex, (r) => (r.supply = input)),
												}}
											/>
										</td>
										<td>
											<NumberInput
												className="article-input"
												disabled={!record.editable}
												min={0}
												max={record.supply}
												customProps={{
													parse: parseInt,
													startValue: record.remissions,
													filter: (input, previous) => {
														if (input > record.supply) return String(previous);

														updateField(recordIndex, (r) => (r.remissions = input));
													},
												}}
											/>
										</td>
										<td>{soldAmount}</td>
										<td>
											{twoDecimalsFormat.format(record.price!.sell.mul(soldAmount).toNumber())}
										</td>
										<td>
											{twoDecimalsFormat.format(
												record
													.price!.sell.mul(soldAmount)
													.mul((100 + record.price!.mwst) / 100)
													.toNumber()
											)}
										</td>
										<td>
											<StateDisplay record={record} />
										</td>
									</tr>
								);
							})}
							<tr>
								<td colSpan={6} />
								<td style={{ fontWeight: "bold" }}>
									{twoDecimalsFormat.format(
										records.records
											.map((r) =>
												!r.missing ? r.price!.sell.mul(r.supply - r.remissions) : Big(0)
											)
											.reduce((a, b) => a.add(b), Big(0))
											.toNumber()
									)}
								</td>
								<td style={{ fontWeight: "bold" }}>
									{" "}
									{twoDecimalsFormat.format(totalValueBrutto.toNumber())}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			)}
		</React.Fragment>
	);
}

export default ArticleRecordsItem;
