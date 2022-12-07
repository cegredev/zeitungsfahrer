import {
	Activity,
	ChangedCalendarEntry,
	District,
	Driver,
	ScheduleEdit,
	ScheduleEntry,
} from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import Popup from "reactjs-popup";
import { Updater, useImmer } from "use-immer";
import { DELETE, POST, PUT } from "../../api";
import { activities, activityStyles, dayOfYear, weekdays } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import YearSelection from "../time/YearSelection";
import LabeledCheckbox from "../util/LabeledCheckbox";
import YesNoPrompt from "../util/YesNoPrompt";

const numDays = 365;
const newDriverTemplate = {
	id: -1,
	name: "",
	defaultDistrict: -1,
};

function DriverEdit({
	driver: originalDriver,
	districts,
	setSchedule,
}: {
	driver: Driver;
	districts: District[];
	setSchedule: Updater<ScheduleEdit | undefined>;
}) {
	const [driverEdit, setDriverEdit] = useImmer(originalDriver);
	const [token] = useAtom(authTokenAtom);
	const [replaceOld, setReplaceOld] = React.useState(false);

	const isDraft = originalDriver.id === -1;
	const trigger = isDraft ? <button>Neu</button> : <div style={{ cursor: "pointer" }}>{originalDriver.name}</div>;

	return (
		<Popup modal nested trigger={trigger}>
			{/* @ts-ignore */}
			{(close: () => void) => (
				<div className="modal">
					<div className="header">Fahrer bearbeiten</div>
					<div className="content" style={{ display: "flex", flexDirection: "column", gap: 5 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
							<label>Name</label>
							<input
								type="text"
								value={driverEdit.name}
								onChange={(evt) => {
									setDriverEdit((draft) => {
										draft.name = evt.target.value;
									});
								}}
							/>
						</div>

						<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
							<label>Standardbezirk</label>
							<select
								value={driverEdit.defaultDistrict}
								onChange={(evt) => {
									setDriverEdit((draft) => {
										draft.defaultDistrict = parseInt(evt.target.value);
									});
								}}
							>
								{driverEdit.defaultDistrict <= 0 && <option value={-1}>-</option>}
								{districts.map((district) => (
									<option key={district.id} value={district.id}>
										{district.customId}
									</option>
								))}
							</select>
						</div>

						{originalDriver.defaultDistrict !== driverEdit.defaultDistrict && !isDraft && (
							<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
								<LabeledCheckbox
									value={replaceOld}
									setValue={setReplaceOld}
									text="Alte Einträge ersetzen"
								/>
							</div>
						)}
					</div>

					<div className="actions">
						{!isDraft && (
							<YesNoPrompt
								trigger={<button>Löschen</button>}
								header="Fahrer löschen"
								content={`Wollen Sie den Fahrer "${originalDriver.name}" wirklich löschen?`}
								onYes={async () => {
									await DELETE("/auth/plan/calendar/drivers/" + originalDriver.id, token!);

									setSchedule((draft) => {
										const index = draft?.drivers.findIndex(
											(driver) => driver.id === driverEdit.id
										)!;

										draft!.calendar.splice(index, 1);
									});

									close();
								}}
							/>
						)}
						<button
							onClick={async () => {
								close();

								setDriverEdit(newDriverTemplate);
							}}
						>
							Abbrechen
						</button>
						<button
							disabled={driverEdit.name.length === 0 || driverEdit.defaultDistrict <= 0}
							onClick={async () => {
								let editedDriver = driverEdit;

								if (editedDriver.id === -1) {
									const res = await POST<{ id: number }>(
										"/auth/plan/calendar/drivers",
										editedDriver,
										token!
									);

									const id = res.data.id;
									editedDriver = {
										...editedDriver,
										id,
									};

									setSchedule((draft) => {
										draft!.drivers.push(editedDriver);

										draft!.calendar.push(
											Array(numDays)
												.fill(null)
												.map(() => ({
													activity: activities.working,
													district: editedDriver.defaultDistrict,
												}))
										);
									});
								} else {
									const oldDefault =
										!replaceOld || originalDriver.defaultDistrict === driverEdit.defaultDistrict
											? undefined
											: originalDriver.defaultDistrict;

									await PUT("/auth/plan/calendar/drivers", { ...editedDriver, oldDefault }, token!);

									setSchedule((draft) => {
										const index = draft?.drivers.findIndex((d) => d.id === editedDriver.id)!;
										draft!.drivers[index] = editedDriver;

										if (oldDefault) {
											const row = draft!.calendar[index];
											row.forEach(
												(id, i) =>
													row[i].district === oldDefault &&
													(row[i].district = editedDriver.defaultDistrict)
											);
										}
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
	schedule: ScheduleEdit;
	setSchedule: Updater<ScheduleEdit | undefined>;
	changedEntries: ChangedCalendarEntry[];
	setChangedEntries: Updater<ChangedCalendarEntry[]>;
}

const targetedDate = Math.max(0, dayOfYear(dayjs(new Date()).set("day", 1).toDate()) - 2);

function CalendarTable({ date, setDate, schedule, setSchedule, changedEntries, setChangedEntries }: Props) {
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
					<th className="frozen-column">Fahrer</th>
					{Array(numDays)
						.fill(null)
						.map((_, index) => {
							return <th key={index}>{weekdays[(6 + date.getDay() + index) % 7]}</th>;
						})}
				</tr>
			</thead>
			<tbody>
				{schedule.calendar.map((row, rowIndex) => {
					const driver = schedule.drivers[rowIndex];

					return (
						<tr key={rowIndex}>
							<td className="frozen-column" style={{ whiteSpace: "nowrap" }}>
								<DriverEdit
									key={driver.id}
									driver={driver}
									districts={schedule.districts}
									setSchedule={setSchedule}
								/>
							</td>
							{row.map((entry, dayYear) => (
								<td
									key={dayYear}
									style={{ backgroundColor: activityStyles.get(entry.activity)?.backgroundColor }}
								>
									<select
										// Centers select in td
										style={{ display: "block", margin: "0 auto" }}
										value={entry.activity === 0 ? -entry.district! : entry.activity}
										onChange={(evt) => {
											const activity: Activity = parseInt(evt.target.value);
											if (activity > 5) return;

											let newCell: ScheduleEntry = {
												activity,
											};

											if (activity < 0) newCell = { activity: 0, district: -activity };

											setSchedule((draft) => {
												draft!.calendar[rowIndex][dayYear] = newCell;
											});

											setChangedEntries((draft) => {
												const newEntry = {
													date: dayjs()
														.year(date.getFullYear())
														.month(0)
														.date(1)
														.add(dayYear, "days")
														.format("YYYY-MM-DD"),
													driverId: driver.id,
													...newCell,
												};

												console.log(newEntry.date);

												const index = changedEntries.findIndex(
													(entry) =>
														entry.driverId === driver.id &&
														dayOfYear(dayjs(entry.date).toDate()) === dayYear
												);

												if (index === -1) {
													draft.push(newEntry);
												} else {
													draft[index] = newEntry;
												}
											});
										}}
									>
										{[...activityStyles.entries()].slice(1).map(([id, activity]) => (
											<option
												key={id}
												value={id}
												style={{
													backgroundColor: activity.backgroundColor,
													color: activity.color,
												}}
											>
												{String(activity.displayName)}
											</option>
										))}

										{schedule.districts.map((district) => (
											<option key={district.id} value={-district.id}>
												Bezirk {district.customId}
											</option>
										))}
									</select>
								</td>
							))}
						</tr>
					);
				})}
				<tr>
					<td className="frozen-column">
						<DriverEdit
							driver={newDriverTemplate}
							districts={schedule.districts}
							setSchedule={setSchedule}
						/>
					</td>
				</tr>
			</tbody>
		</table>
	);
}

export default CalendarTable;
