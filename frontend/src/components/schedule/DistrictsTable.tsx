import { District, DistrictActivity, DistrictCalendar } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import Popup from "reactjs-popup";
import { Updater, useImmer } from "use-immer";
import { DELETE, POST, PUT } from "../../api";
import { activityStyles, dayOfYear, weekdays } from "../../consts";
import { ChangedEntry } from "../../pages/settings/DistrictCalendar";
import { authTokenAtom } from "../../stores/utility.store";
import YearSelection from "../time/YearSelection";
import NumberInput from "../util/NumberInput";

const numDays = 365;
const targetedDate = Math.max(0, dayOfYear(dayjs(new Date()).set("day", 1).toDate()) - 2);

function DistrictEdit({
	district,
	districts,
	setCalendar,
}: {
	district: District;
	districts: District[];
	setCalendar: Updater<DistrictCalendar | undefined>;
}) {
	const [token] = useAtom(authTokenAtom);
	const [districtEdit, setDistrictEdit] = useImmer(district);

	const isDraft = district.id === -1;
	const trigger = isDraft ? <button>Neu</button> : <div style={{ cursor: "pointer" }}>{district.customId}</div>;

	return (
		<Popup modal nested trigger={<div style={{ cursor: "pointer" }}>{trigger}</div>}>
			{/* @ts-ignore */}
			{(close: () => void) => (
				<div className="modal">
					<div className="header">Bezirk bearbeiten</div>
					<div className="content" style={{ display: "flex", flexDirection: "column", gap: 5 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
							<label>Nummer</label>
							<NumberInput
								customProps={{
									parse: parseInt,
									startValue: districtEdit.customId || 0,
									filter: (value) =>
										setDistrictEdit((draft) => {
											draft.customId = value;
										}),
								}}
							/>
						</div>
					</div>

					<div className="actions">
						{!isDraft && (
							<button
								onClick={async () => {
									await DELETE("/auth/calendar/districts?id=" + district.id, token!);

									setCalendar((draft) => {
										const index = draft?.districts.findIndex((d) => d.id === district.id)!;

										draft!.districts.splice(index, 1);
										draft!.calendar.splice(index, 1);
									});

									close();
								}}
							>
								Löschen
							</button>
						)}
						<button
							onClick={async () => {
								close();
							}}
						>
							Abbrechen
						</button>
						<button
							disabled={
								districtEdit.customId === undefined ||
								(district.customId !== districtEdit.customId &&
									districts.find((district) => district.customId === districtEdit.customId) !==
										undefined)
							}
							onClick={async () => {
								if (!isDraft) {
									await PUT(
										"/auth/calendar/districts/" + district.id,
										{ customId: districtEdit.customId },
										token!
									);

									setCalendar((draft) => {
										draft!.districts.find((d) => d.id === district.id)!.customId =
											districtEdit.customId;
									});
								} else {
									const response = await POST<{ id: number }>(
										"/auth/calendar/districts",
										{ customId: districtEdit.customId },
										token!
									);

									setCalendar((draft) => {
										draft!.districts.push({
											id: response.data.id,
											customId: districtEdit.customId,
										});

										draft!.calendar.push(Array(365).fill(0));
									});
								}

								close();
							}}
						>
							Speichern
						</button>
					</div>
				</div>
			)}
		</Popup>
	);
}

interface Props {
	date: Date;
	setDate: (date: Date) => void;
	calendar: DistrictCalendar;
	setCalendar: Updater<DistrictCalendar | undefined>;
	changedEntries: ChangedEntry[];
	setChangedEntries: Updater<ChangedEntry[]>;
}

function DistrictsTable({ date, setDate, calendar, setCalendar, changedEntries, setChangedEntries }: Props) {
	const targetedColumn = React.useRef<any | null>(null);

	React.useEffect(() => {
		targetedColumn.current!.scrollIntoView({
			inline: "start",
		});
	}, []);

	return (
		<table className="schedule-table">
			<thead>
				<tr>
					<th className="frozen-column" style={{ whiteSpace: "nowrap" }}>
						<YearSelection date={date} setDate={setDate} />
					</th>
					{Array(numDays)
						.fill(null)
						.map((_, dayOfYear) => (
							<th ref={dayOfYear === targetedDate ? targetedColumn : undefined} key={dayOfYear}>
								{dayjs(date).add(dayOfYear, "days").format("DD.MM.YYYY")}
							</th>
						))}
				</tr>
				<tr>
					<th className="frozen-column">Bezirk</th>
					{Array(numDays)
						.fill(null)
						.map((_, index) => {
							return <th key={index}>{weekdays[(6 + date.getDay() + index) % 7]}</th>;
						})}
				</tr>
			</thead>
			<tbody>
				{calendar.districts.map((district, districtIndex) => {
					return (
						<tr key={district.id}>
							<td className="frozen-column">
								<DistrictEdit
									district={district}
									districts={calendar.districts}
									setCalendar={setCalendar}
								/>
							</td>
							{calendar.calendar[districtIndex].map((activity, dayYear) => (
								<td
									key={dayYear}
									style={{
										backgroundColor: activityStyles.get(activity)?.backgroundColor,
									}}
								>
									<select
										value={activity}
										onChange={(evt) => {
											const activity = parseInt(evt.target.value);

											setChangedEntries((draft) => {
												const newEntry = {
													date: dayjs()
														.year(date.getFullYear())
														.month(0)
														.date(1)
														.add(dayYear, "days")
														.format("YYYY-MM-DD"),
													districtId: district.id,
													activity,
												};

												const index = draft.findIndex(
													(entry) =>
														dayOfYear(new Date(entry.date)) === dayYear &&
														entry.districtId === district.id
												);

												if (index === -1) {
													draft.push(newEntry);
												} else {
													draft[index] = newEntry;
												}
											});

											setCalendar((draft) => {
												draft!.calendar[districtIndex][dayYear] = activity;
											});
										}}
									>
										<option value="0" style={activityStyles.get(0)}>
											Aktiv
										</option>
										<option value="1" style={activityStyles.get(1)}>
											Planfrei
										</option>
									</select>
								</td>
							))}
						</tr>
					);
				})}
				<tr>
					<td className="frozen-column">
						<DistrictEdit district={{ id: -1 }} districts={calendar.districts} setCalendar={setCalendar} />
					</td>
				</tr>
			</tbody>
		</table>
	);
}

export default DistrictsTable;
