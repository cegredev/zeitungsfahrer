import { DistrictActivity, DistrictCalendar } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import Popup from "reactjs-popup";
import { Updater, useImmer } from "use-immer";
import { DELETE, GET, POST } from "../../api";
import { activityStyles, dayOfYear, weekdays } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import YearSelection from "../time/YearSelection";
import LoadingPlaceholder from "../util/LoadingPlaceholder";
import YesNoPrompt from "../util/YesNoPrompt";

const numDays = 365;
const targetedDate = Math.max(0, dayOfYear(dayjs(new Date()).set("day", 1).toDate()) - 2);
const startDate = dayjs(new Date()).set("month", 0).set("date", 0).toDate();

function DistrictEdit({
	district,
	setCalendar,
}: {
	district: number;
	setCalendar: Updater<DistrictCalendar | undefined>;
}) {
	const [token] = useAtom(authTokenAtom);

	return (
		<Popup modal nested trigger={<div style={{ cursor: "pointer" }}>{district}</div>}>
			{/* @ts-ignore */}
			{(close: () => void) => (
				<div className="modal">
					<div className="header">Bezirk löschen</div>
					<div className="content" style={{ display: "flex", flexDirection: "column", gap: 5 }}>
						Wollen Sie diesen Bezirk wirklich löschen?
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
								await DELETE("/auth/calendar/districts?id=" + district, token!);

								setCalendar((draft) => {
									const index = draft?.districts.findIndex((id) => id === district)!;

									draft!.districts.splice(index, 1);
									draft!.calendar.splice(index, 1);
								});

								close();
							}}
						>
							Löschen
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
}

function DistrictsTable({ date, setDate, calendar, setCalendar }: Props) {
	const targetedColumn = React.useRef<any | null>(null);

	const [token] = useAtom(authTokenAtom);

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
				{calendar.districts.map((districtId, districtIndex) => {
					return (
						<tr key={districtId}>
							<td className="frozen-column">
								<DistrictEdit district={districtId} setCalendar={setCalendar} />
							</td>
							{calendar.calendar[districtIndex].map((activity, date) => (
								<td
									key={date}
									style={{
										backgroundColor: activityStyles.get(activity)?.backgroundColor,
									}}
								>
									<select
										value={activity}
										onChange={(evt) => {
											const activity = parseInt(evt.target.value);

											setCalendar((draft) => {
												draft!.calendar[districtIndex][date] = activity;
											});
										}}
									>
										<option value="0">Aktiv</option>
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
					<td>
						<button
							onClick={async () => {
								const response = await POST<{ id: number }>(
									"/auth/calendar/districts",
									undefined,
									token!
								);

								setCalendar((draft) => {
									draft!.districts.push(response.data.id);

									draft!.calendar.push(Array(365).fill(0));
								});
							}}
						>
							Neu
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	);
}

export default DistrictsTable;
