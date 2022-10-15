import { Activity, ScheduleEdit, ScheduleEntry } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { useImmer } from "use-immer";
import { GET, POST } from "../../api";
import { activities, weekdays } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import YesNoPrompt from "../util/YesNoPrompt";

const start = new Date("2022-01-01");
const end = new Date("2022-12-31");

const activityColors: Map<number, string> = new Map([
	[activities.working, "#756f75"],
	[activities.planfrei, "#f0d62b"],
	[activities.vacation, "#07a812"],
	[activities.sick, "#bf0404"],
	[activities.plus, "#2f36a1"],
	[activities.planfreiAndVacation, "#920794"],
]);

function ScheduleEditMode() {
	const [token] = useAtom(authTokenAtom);

	const [schedule, setSchedule] = useImmer<ScheduleEdit | undefined>(undefined);

	React.useEffect(() => {
		async function fetchData() {
			const year = start.getFullYear();
			const calendarRes = await GET(
				"/auth/calendar/edit?start=" +
					dayjs(start).format("YYYY-MM-DD") +
					"&end=" +
					dayjs(end).format("YYYY-MM-DD"),
				token
			);
			setSchedule(await calendarRes.json());
		}

		fetchData();
	}, [setSchedule, start, token]);

	const numDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

	return (
		<React.Fragment>
			{schedule === undefined ? (
				<div>Laden...</div>
			) : (
				<table className="schedule-table">
					<thead>
						<tr>
							<th style={{ whiteSpace: "nowrap" }}>
								{/* KW <WeekSelection date={date} setDate={setDate} /> */}
								<YesNoPrompt
									trigger={<button style={{ marginLeft: 10, color: "green" }}>Speichern</button>}
									header="Speichern"
									content="Wollen Sie wirklich speichern?"
									onYes={async () => {
										await POST(
											"/auth/calendar?date=" + dayjs(start).format("YYYY-MM-DD"),
											schedule,
											token!
										);
									}}
								/>
							</th>
							{Array(numDays)
								.fill(null)
								.map((_, index) => {
									return <th key={index}>{dayjs(start).add(index, "days").format("DD.MM.YYYY")}</th>;
								})}
						</tr>
						<tr>
							<th>Fahrer</th>
							{Array(numDays)
								.fill(null)
								.map((_, index) => {
									return <th key={index}>{weekdays[(6 + start.getDay() + index) % 7]}</th>;
								})}
						</tr>
					</thead>
					<tbody>
						{schedule.calendar.map((row, rowIndex) => (
							<tr key={rowIndex}>
								<td style={{ whiteSpace: "nowrap" }}>{schedule.drivers[rowIndex].name}</td>
								{row.map((entry, entryIndex) => (
									<td
										key={entryIndex}
										style={{ backgroundColor: activityColors.get(entry.activity) }}
									>
										<select
											value={entry.district ? -entry.district : entry.activity}
											onChange={(evt) => {
												// @ts-ignore
												const activity: Activity = parseInt(evt.target.value);
												if (activity > 5) return;

												let newCell: ScheduleEntry = {
													activity,
												};

												if (activity < 0) newCell = { activity: 0, district: -activity };

												setSchedule((s) => {
													s!.calendar[rowIndex][entryIndex] = newCell;
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
						))}
					</tbody>
				</table>
			)}
		</React.Fragment>
	);
}

export default ScheduleEditMode;
