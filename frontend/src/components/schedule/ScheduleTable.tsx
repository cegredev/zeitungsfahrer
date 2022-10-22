import { Driver, ScheduleView } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import SelectSearch, { SelectSearchOption } from "react-select-search";
import { useImmer } from "use-immer";
import { GET } from "../../api";
import { activities, activityStyles, weekdays } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import WeekSelection from "../timeframe/WeekSelection";
import "../util/select_search.css";
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
			<tr style={{ backgroundColor: style.backgroundColor, color: style.color }}>
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
									return <th key={index}>{dateCounter.add(index, "days").format("DD.MM.YYYY")}</th>;
								})}
						</tr>
						<tr>
							<th>Bezirk</th>
							{Array(numDays)
								.fill(null)
								.map((_, index) => {
									return <th key={index}>{weekdays[(6 + date.getDay() + index) % 7]}</th>;
								})}
						</tr>
					</thead>
					<tbody>
						{schedule.districts.map((week) => {
							const districtId = week.district;

							return (
								<tr key={districtId + Math.random()}>
									<td>{districtId}</td>
									{week.drivers.map((driverId, day) => {
										let content: JSX.Element;

										if (driverId === -1) {
											const options: SelectSearchOption[] = [
												{
													type: "group",
													name: "Plus",
													items: schedule.plus[day].map((driverIdOption) => ({
														name: driverMap.get(driverIdOption)!.name,
														value: driverIdOption,
													})),
												},
												{
													type: "group",
													name: "Planfrei",
													items: schedule.free[day].map((driverIdOption) => ({
														name: driverMap.get(driverIdOption)!.name,
														value: driverIdOption,
													})),
												},
											];

											content = (
												<SelectSearch
													options={options}
													placeholder="Ersatz wählen"
													search={true}
												/>
											);
										} else {
											const driver = driverMap.get(driverId)!;
											content = <div>{driver.name}</div>;
										}

										return (
											<td style={{ maxHeight: 30 }} key={day}>
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
