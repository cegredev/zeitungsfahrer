import { Activity, ScheduleEdit, ScheduleEntry } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { Updater, useImmer } from "use-immer";
import { GET, POST } from "../../api";
import { activities, weekdays } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import YearSelection from "../timeframe/YearSelection";
import YesNoPrompt from "../util/YesNoPrompt";

const activityColors: Map<number, string> = new Map([
	[activities.working, "#756f75"],
	[activities.planfrei, "#f0d62b"],
	[activities.vacation, "#07a812"],
	[activities.sick, "#bf0404"],
	[activities.plus, "#2f36a1"],
	[activities.planfreiAndVacation, "#920794"],
]);

interface Props {
	date: Date;
	setDate: (date: Date) => void;
	schedule: ScheduleEdit;
	setSchedule: Updater<ScheduleEdit | undefined>;
}

function ScheduleEditModeTable({ date, setDate, schedule, setSchedule }: Props) {
	const numDays = 365;

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
				{schedule.calendar.map((row, rowIndex) => (
					<tr key={rowIndex}>
						<td style={{ whiteSpace: "nowrap" }}>{schedule.drivers[rowIndex].name}</td>
						{row.map((entry, entryIndex) => (
							<td key={entryIndex} style={{ backgroundColor: activityColors.get(entry.activity) }}>
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
				))}
			</tbody>
		</table>
	);
}

export default ScheduleEditModeTable;
