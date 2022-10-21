import { Activity, Driver, ScheduleEdit, ScheduleEntry } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import Popup from "reactjs-popup";
import { Updater, useImmer } from "use-immer";
import { POST, PUT } from "../../api";
import { activities, activityStyles, weekdays } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import YearSelection from "../timeframe/YearSelection";

const numDays = 365;

function EditDriver({
	driver,
	districts,
	setSchedule,
}: {
	driver: Driver;
	districts: number[];
	setSchedule: Updater<ScheduleEdit | undefined>;
}) {
	const [draft, setDraft] = useImmer(driver);
	const [token] = useAtom(authTokenAtom);

	const trigger = driver.id === -1 ? <button>Neu</button> : <div>{draft.name}</div>;

	return (
		<Popup modal nested trigger={trigger}>
			{/* @ts-ignore */}
			{(close: () => void) => (
				<div className="modal">
					<div className="header">Fahrer bearbeiten</div>
					<div className="content">
						<input
							type="text"
							value={draft.name}
							onChange={(evt) => {
								setDraft((draft) => {
									if (evt.target.value.length < 1) return;

									draft.name = evt.target.value;
								});
							}}
						/>
						<select
							value={draft.defaultDistrict}
							onChange={(evt) => {
								setDraft((draft) => {
									draft.defaultDistrict = parseInt(evt.target.value);
								});
							}}
						>
							{districts.map((district) => (
								<option key={district} value={district}>
									{district}
								</option>
							))}
						</select>
					</div>
					<div className="actions">
						<button
							onClick={async () => {
								close();
							}}
						>
							Abbrechen
						</button>
						<button
							onClick={async () => {
								let driver = draft;

								if (driver.id === -1) {
									const res = await POST("/auth/calendar/drivers", driver, token!);

									const id = (await res.json()).id;
									driver = {
										...driver,
										id,
									};

									setSchedule((draft) => {
										draft!.drivers.push(driver);

										draft!.calendar.push(
											Array(numDays)
												.fill(null)
												.map(() => ({
													activity: activities.working,
													district: driver.defaultDistrict,
												}))
										);
									});
								} else {
									await PUT("/auth/calendar/drivers", driver, token!);

									setSchedule((draft) => {
										const i = draft?.drivers.findIndex((d) => d.id === driver.id)!;
										draft!.drivers[i] = driver;
									});
								}

								setDraft({
									name: "Neu",
									id: -1,
									defaultDistrict: 2,
								});
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
}

function ScheduleEditModeTable({ date, setDate, schedule, setSchedule }: Props) {
	return (
		<table className="schedule-table">
			<thead>
				<tr>
					<th style={{ whiteSpace: "nowrap" }}>
						<YearSelection date={date} setDate={setDate} />
					</th>
					{Array(numDays)
						.fill(null)
						.map((_, index) => {
							return <th key={index}>{dayjs(date).add(index, "days").format("DD.MM.YYYY")}</th>;
						})}
				</tr>
				<tr>
					<th>Fahrer</th>
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
							<td style={{ whiteSpace: "nowrap" }}>
								<EditDriver
									key={driver.id}
									driver={driver}
									districts={schedule.districts}
									setSchedule={setSchedule}
								/>
							</td>
							{row.map((entry, entryIndex) => (
								<td
									key={entryIndex}
									style={{ backgroundColor: activityStyles.get(entry.activity)?.color }}
								>
									<select
										value={entry.activity === 0 ? -entry.district! : entry.activity}
										onChange={(evt) => {
											const activity: Activity = parseInt(evt.target.value);
											if (activity > 5) return;

											let newCell: ScheduleEntry = {
												activity,
											};

											if (activity < 0) newCell = { activity: 0, district: -activity };

											setSchedule((draft) => {
												draft!.calendar[rowIndex][entryIndex] = newCell;
											});
										}}
									>
										<option value="1">Planfrei</option>
										<option value="2">Urlaub</option>
										<option value="3">Krank</option>
										<option value="4">Plus</option>
										<option value="5">Planfrei + Urlaub</option>
										{schedule.districts.map((district) => (
											<option key={district} value={-district}>
												Bezirk {district}
											</option>
										))}
									</select>
								</td>
							))}
						</tr>
					);
				})}
				<tr>
					<td>
						<EditDriver
							driver={{ name: "Neu", id: -1, defaultDistrict: 0 }}
							districts={schedule.districts}
							setSchedule={setSchedule}
						/>
					</td>
				</tr>
			</tbody>
		</table>
	);
}

export default ScheduleEditModeTable;
