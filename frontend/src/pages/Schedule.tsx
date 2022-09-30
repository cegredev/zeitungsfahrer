import dayjs from "dayjs";
import React from "react";
import WeekSelection from "../components/timeframe/WeekSelection";
import { weekdays } from "../consts";
import { ScheduleInfo } from "backend/src/models/schedule.model";
import { SimpleVendor } from "backend/src/models/vendors.model";
import { GET } from "../api";
import { useAtom } from "jotai";
import { authTokenAtom } from "../components/stores/utility.store";
import YearSelection from "../components/timeframe/YearSelection";
import YesNoPrompt from "../components/util/YesNoPrompt";

const weekStart = new Date("2022-01-01");

function Schedule() {
	const [date, setDate] = React.useState(weekStart);
	const [vendors, setVendors] = React.useState<SimpleVendor[] | undefined>(undefined);
	const [token] = useAtom(authTokenAtom);

	const [schedule, setSchedule] = React.useState<ScheduleInfo | undefined>(undefined);

	console.log(schedule);

	React.useEffect(() => {
		async function fetchData() {
			const res = await GET("/auth/vendors?simple=true", token);
			const data = await res.json();
			setVendors(data);

			const year = date.getFullYear();
			const calendarRes = await GET("/auth/calendar?start=" + year + "-01-01&end=" + year + "-12-31", token);
			setSchedule(await calendarRes.json());
		}

		fetchData();
	}, [setVendors, date, token]);

	const dateCounter = dayjs(date);
	const cellHeight = 50;

	return (
		<div className="page">
			{vendors === undefined || schedule === undefined ? (
				<div>Laden...</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
					<div className="panel">
						Jahr <YearSelection date={date} setDate={setDate} />
						<YesNoPrompt
							trigger={<button style={{ marginLeft: 10, color: "green" }}>Speichern</button>}
							header="Speichern"
							content="Wollen Sie wirklich speichern?"
							onYes={() => {
								console.log("saved");
							}}
						/>
					</div>

					<div style={{ display: "flex", gap: 10 }}>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								backgroundColor: "lightgray",
								borderRadius: 5,
								alignItems: "stretch",
								textAlign: "center",
								padding: 5,
							}}
						>
							<h3>Händler</h3>
							{vendors.map((vendor) => {
								return (
									<div
										style={{ borderBottom: "solid 1px", backgroundColor: "white" }}
										key={"schedule-vendor-" + vendor.id}
									>
										{vendor.name}
									</div>
								);
							})}
						</div>

						<table className="schedule-table">
							<thead>
								<tr>
									<th style={{ whiteSpace: "nowrap" }}>
										KW <WeekSelection date={date} setDate={setDate} />
									</th>
									{Array(365)
										.fill(null)
										.map((_, index) => {
											return (
												<th key={"schedule-header-" + index}>
													{dateCounter.add(index, "days").format("DD.MM.YYYY")}
												</th>
											);
										})}
								</tr>
							</thead>
							<tbody>
								{/* <tr style={{ height: cellHeight }}>
									<td>Bezirk</td>
									{Array(365)
										.fill(undefined)
										.map((_, i) => (
											<td>{weekdays[i + weekStart.getDay()]}</td>
										))}
								</tr> */}
								{schedule.districts.map((week, districtIndex) => {
									const districtId = week.district.id;
									return (
										<tr key={"schedule-district-" + districtId}>
											<td>{districtId}</td>
											{week.vendorIds.map((vendorId, weekday) => {
												return (
													<td
														style={{ maxHeight: 30 }}
														key={"vendor-row-schedule-" + districtId + "-" + weekday}
													>
														<select
															value={vendorId}
															onChange={(evt) => {
																const newDistrictWeeks = [...schedule.districts];
																const newVendorIds = [...week.vendorIds];
																newVendorIds[weekday] = parseInt(evt.target.value);
																newDistrictWeeks[districtIndex].vendorIds =
																	newVendorIds;
																setSchedule({
																	...schedule,
																	districts: newDistrictWeeks,
																});
															}}
														>
															<option value={-1}>-</option>
															{vendors.map((vendor, k) => {
																return (
																	<option
																		value={vendor.id}
																		key={
																			"vendor-row-schedule-option-" +
																			districtId +
																			"-" +
																			vendorId +
																			"-" +
																			k
																		}
																		style={{
																			color: vendor.active ? "inherit" : "red",
																		}}
																	>
																		{vendor.name}
																	</option>
																);
															})}
														</select>
													</td>
												);
											})}
										</tr>
									);
								})}
								<tr style={{ backgroundColor: "lightgreen" }}>
									<td>Urlaub</td>
									<td colSpan={365}></td>
								</tr>
								<tr>
									<td />
									{schedule.vacation.map((vendorIds, i) => {
										return (
											<td key={"schedule-vacation-" + vendorIds + "-" + i}>
												{vendorIds.map((id) => (
													<div>{vendors.find((v) => v.id === id)!.name}</div>
												))}
											</td>
										);
									})}
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}

export default Schedule;
