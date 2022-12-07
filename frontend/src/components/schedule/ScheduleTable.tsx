import { Driver, ScheduleView } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import Select from "react-select";
import React from "react";
import { GroupBase } from "react-select";
import { useImmer } from "use-immer";
import { DELETE, GET, POST } from "../../api";
import { activities, activityStyles, dayOfYear, weekdays } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import WeekSelection from "../time/WeekSelection";
import LoadingPlaceholder from "../util/LoadingPlaceholder";
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
			const calendarRes = await GET<ScheduleView>(
				"/auth/plan/calendar/view?start=" +
					dayjs(date).set("day", 1).format("YYYY-MM-DD") +
					"&end=" +
					dayjs(date).set("day", 6).format("YYYY-MM-DD"),
				token
			);
			setSchedule(calendarRes.data);
		}

		fetchData();
	}, [setSchedule, date, token]);

	const dateCounter = dayjs(date);

	return (
		<React.Fragment>
			{schedule === undefined ? (
				<LoadingPlaceholder />
			) : (
				<table className="schedule-table">
					<thead>
						<tr>
							{/* <th style={{ whiteSpace: "nowrap" }}>
								KW <WeekSelection date={date} setDate={setDate} />
							</th> */}
							<th />
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
						{schedule.districts.map((week, districtIndex) => {
							const district = week.district;

							return (
								<tr key={district.id}>
									<td>{district.customId}</td>
									{week.drivers.map((weekDriver, dayOfWeek) => {
										let content: JSX.Element;

										if (
											weekDriver.id === -1 ||
											weekDriver.id === -2 ||
											weekDriver.oldActivity !== undefined
										) {
											const options = [
												{
													label: "Plus",
													options: schedule.plus[dayOfWeek].map((driverIdOption) => ({
														label: driverMap.get(driverIdOption)!.name,
														value: driverIdOption,
													})),
												},
												{
													label: "Planfrei",
													options: schedule.free[dayOfWeek].map((driverIdOption) => ({
														label: driverMap.get(driverIdOption)!.name,
														value: driverIdOption,
													})),
												},
											];

											content = (
												<Select
													classNamePrefix="schedule-select"
													options={options}
													isClearable={true}
													placeholder="Fehlt"
													noOptionsMessage={() => "Alle Fahrer im Einsatz"}
													onChange={async (option, { action }) => {
														const timestamp = {
															date: dayjs(date)
																.day((dayOfWeek + 1) % 6)
																.format("YYYY-MM-DD"),
														};
														const id =
															action === "select-option"
																? // @ts-ignore
																  option!.value
																: -1;
														const oldDriver = weekDriver;

														// Restore previous driver to original activity
														if (oldDriver.id !== -1 && oldDriver.id !== -2) {
															await POST(
																"/auth/plan/calendar/view",
																{
																	...timestamp,
																	driverId: oldDriver.id,
																	activity: oldDriver.oldActivity,
																},
																token!
															);
														}

														// Update current driver
														if (id !== -1) {
															await POST(
																"/auth/plan/calendar/view",
																{
																	...timestamp,
																	driverId: id,
																	activity: activities.working,
																	district: district.id,
																},
																token!
															);
														}

														setSchedule((draft) => {
															let hiddenActivity = 0;

															Array<[number[], number]>(
																[draft!.free[dayOfWeek], activities.planfrei],
																[draft!.plus[dayOfWeek], activities.plus]
															).forEach(([section, activity]) => {
																const index = section.findIndex(
																	(driverId) => driverId === id
																);

																if (index !== -1) {
																	section.splice(index, 1);
																	hiddenActivity = activity;
																}

																if (weekDriver.oldActivity === activity) {
																	section.push(oldDriver.id);
																}
															});

															draft!.districts[districtIndex].drivers[dayOfWeek] = {
																id,
																oldActivity: hiddenActivity,
															};
														});
													}}
												/>
											);
										} else {
											const driver = driverMap.get(weekDriver.id)!;
											content = <div>{driver.name}</div>;
										}

										return (
											<td style={{ minHeight: 10, height: 30, maxHeight: 30 }} key={dayOfWeek}>
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
