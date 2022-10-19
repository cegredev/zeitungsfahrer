import { Activity, ScheduleEdit, ScheduleEntry } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { Updater } from "use-immer";
import { activityStyles, weekdays } from "../../consts";
import YearSelection from "../timeframe/YearSelection";

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
							<td key={entryIndex} style={{ backgroundColor: activityStyles.get(entry.activity)?.color }}>
								<select
									value={entry.activity === 0 ? -entry.district! : entry.activity}
									onChange={(evt) => {
										// @ts-ignore
										const activity: Activity = parseInt(evt.target.value);
										if (activity > 5) return;

										let newCell: ScheduleEntry = {
											activity,
										};

										if (activity < 0) newCell = { activity: 0, district: -activity };
										// if (activity === 5)
										// 	newCell = {
										// 		activity: 5,
										// 		district: schedule.drivers[rowIndex].defaultDistrict,
										// 	};

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
