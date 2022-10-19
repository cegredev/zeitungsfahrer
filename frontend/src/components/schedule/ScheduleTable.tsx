import { Driver, ScheduleView } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { useImmer } from "use-immer";
import { GET } from "../../api";
import { activities, activityStyles, weekdays } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import WeekSelection from "../timeframe/WeekSelection";
const numDays = 6;

interface SectionProps {
	drivers: number[][];
	activity: number;
	driverMap: Map<number, Driver>;
}

function Section({ drivers, activity, driverMap }: SectionProps) {
	const style = activityStyles.get(activity)!;

	return (
		<>
			<tr style={{ backgroundColor: style.color }}>
				<td>{style.displayName}</td>
				<td colSpan={numDays}></td>
			</tr>
			<tr>
				<td />
				{drivers.map((row, i) => (
					<td style={{ verticalAlign: "top" }} key={i}>
						{row.map((id) => (
							<div key={id}>{driverMap.get(id)!.name}</div>
						))}
					</td>
				))}
			</tr>
		</>
	);
}

interface Props {
	drivers: Driver[];
	date: Date;
	setDate: (date: Date) => void;
}

function ScheduleTable({ drivers, date, setDate }: Props) {
	const driverMap = new Map<number, Driver>();
	if (drivers !== undefined) {
		drivers.forEach((driver) => driverMap.set(driver.id, driver));
	}

	const [token] = useAtom(authTokenAtom);

	const [schedule, setSchedule] = useImmer<ScheduleView | undefined>(undefined);

	React.useEffect(() => {
		async function fetchData() {
			const calendarRes = await GET(
				"/auth/calendar/view?start=" +
					dayjs(date).set("day", 1).format("YYYY-MM-DD") +
					"&end=" +
					dayjs(date).set("day", 6).format("YYYY-MM-DD"),
				token
			);
			setSchedule(await calendarRes.json());
		}

		fetchData();
	}, [setSchedule, date, token]);

	const dateCounter = dayjs(date);

	return (
		<React.Fragment>
			{schedule === undefined ? (
				<div>Laden...</div>
			) : (
				<table className="schedule-table">
					<thead>
						<tr>
							<th style={{ whiteSpace: "nowrap" }}>
								KW <WeekSelection date={date} setDate={setDate} />
							</th>
							{Array(numDays)
								.fill(null)
								.map((_, index) => {
									return (
										<th key={"schedule-header-" + index}>
											{dateCounter.add(index, "days").format("DD.MM.YYYY")}
										</th>
									);
								})}
						</tr>
						<tr>
							<th>Bezirk</th>
							{Array(numDays)
								.fill(null)
								.map((_, index) => {
									return (
										<th key={"schedule-header-weekday-" + index}>
											{weekdays[(6 + date.getDay() + index) % 7]}
										</th>
									);
								})}
						</tr>
					</thead>
					<tbody>
						{schedule.districts.map((week) => {
							const districtId = week.district;

							return (
								<tr key={districtId}>
									<td>{districtId}</td>
									{week.drivers.map((driverId, day) => {
										let color: string, content: string;

										switch (driverId) {
											case -2:
												color = activityStyles.get(activities.planfrei)!.color!;
												content = "-";
												break;
											case -1:
												color = "inherit";
												content = "-";
												break;
											default:
												color = "inherit";
												content = driverMap.get(driverId)!.name;
												break;
										}

										return (
											<td style={{ backgroundColor: color, maxHeight: 30 }} key={day}>
												{content}
											</td>
										);
									})}
								</tr>
							);
						})}

						{Array<[number, number[][]]>(
							[1, schedule.free],
							[2, schedule.vacation],
							[3, schedule.sick],
							[4, schedule.plus]
						).map(([activity, drivers]) => (
							<Section key={activity} activity={activity} driverMap={driverMap} drivers={drivers} />
						))}
					</tbody>
				</table>
			)}
		</React.Fragment>
	);
}

export default ScheduleTable;
