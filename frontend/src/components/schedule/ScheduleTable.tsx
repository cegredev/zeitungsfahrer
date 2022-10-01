import { ScheduleInfo } from "backend/src/models/schedule.model";
import { SimpleVendor } from "backend/src/models/vendors.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET, POST } from "../../api";
import { authTokenAtom } from "../stores/utility.store";
import WeekSelection from "../timeframe/WeekSelection";
import YesNoPrompt from "../util/YesNoPrompt";
import SelectAdd from "./SelectAdd";

interface Props {
	vendors: SimpleVendor[];
	date: Date;
	setDate: (date: Date) => void;
}

function ScheduleTable({ vendors, date, setDate }: Props) {
	const vendorMap = new Map<number, SimpleVendor>();
	if (vendors !== undefined) {
		vendors.forEach((vendor) => vendorMap.set(vendor.id, vendor));
	}

	const [token] = useAtom(authTokenAtom);

	const [schedule, setSchedule] = React.useState<ScheduleInfo | undefined>(undefined);

	React.useEffect(() => {
		async function fetchData() {
			const year = date.getFullYear();
			const calendarRes = await GET("/auth/calendar?start=" + year + "-01-01&end=" + year + "-12-31", token);
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
								{/* KW <WeekSelection date={date} setDate={setDate} /> */}
								<YesNoPrompt
									trigger={<button style={{ marginLeft: 10, color: "green" }}>Speichern</button>}
									header="Speichern"
									content="Wollen Sie wirklich speichern?"
									onYes={async () => {
										await POST(
											"/auth/calendar?date=" + dayjs(date).format("YYYY-MM-DD"),
											schedule,
											token!
										);
									}}
								/>
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
						{schedule.districts.map((week, districtIndex) => {
							const districtId = week.district.id;
							return (
								<tr key={"schedule-district-" + districtId}>
									<td>{districtId}</td>
									{week.vendorIds.map((vendorId, day) => {
										return (
											<td
												style={{ maxHeight: 30 }}
												key={"vendor-row-schedule-" + districtId + "-" + day}
											>
												<select
													value={vendorId}
													onChange={(evt) => {
														const newVendorId = parseInt(evt.target.value);

														const newDistrictWeeks = [...schedule.districts];
														const newVendorIds = [...week.vendorIds];
														newVendorIds[day] = newVendorId;
														newDistrictWeeks[districtIndex].vendorIds = newVendorIds;

														const newVacation = [...schedule.vacation];

														const vacIndex = newVacation[day].findIndex(
															(id) => id === newVendorId
														);
														if (vacIndex !== -1) newVacation[day].splice(vacIndex, 1);

														const newFree = [...schedule.free];
														const freeIndex = newFree[day].findIndex(
															(id) => id === newVendorId
														);
														console.log("free", freeIndex);
														if (freeIndex !== -1) newFree[day].splice(freeIndex, 1);
														newFree[day].push(vendorId);

														setSchedule({
															districts: newDistrictWeeks,
															vacation: newVacation,
															free: newFree,
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

						<tr style={{ backgroundColor: "yellow" }}>
							<td>Planfrei</td>
							<td colSpan={365}></td>
						</tr>
						<tr>
							<td />
							{schedule.free.map((vendorIds, i) => {
								return (
									<td key={"schedule-free-" + i}>
										{vendorIds.map((id, j) => (
											<div key={"schedule-free-" + i + "-" + j}>{vendorMap.get(id)!.name}</div>
										))}
									</td>
								);
							})}
						</tr>

						<tr style={{ backgroundColor: "lightgreen" }}>
							<td>Urlaub</td>
							<td colSpan={365}></td>
						</tr>
						<tr>
							<td />
							{schedule.vacation.map((vendorIds, day) => {
								return (
									<td key={"schedule-vacation-" + day}>
										{vendorIds.map((id, j) => (
											<div
												key={"schedule-vacation-" + day + "-" + j}
												style={{ whiteSpace: "nowrap" }}
											>
												{vendorMap.get(id)!.name}
												<button
													onClick={() => {
														const newVacation = [...schedule.vacation];
														newVacation[day].splice(j, 1);

														const newFree = [...schedule.free];
														newFree[day].push(id);

														setSchedule({
															...schedule,
															vacation: newVacation,
															free: newFree,
														});
													}}
												>
													-
												</button>
											</div>
										))}

										<SelectAdd
											vendors={schedule.free[day].map((id) => vendorMap.get(id)!)}
											onAdd={async (v) => {
												const newVacation = [...schedule.vacation];
												newVacation[day].push(v.id);

												const newFree = [...schedule.free];
												console.log(newFree[day].findIndex((id) => id === v.id));

												newFree[day].splice(
													newFree[day].findIndex((id) => id === v.id),
													1
												);

												setSchedule({
													...schedule,
													vacation: newVacation,
													free: newFree,
												});
											}}
										/>
									</td>
								);
							})}
						</tr>
					</tbody>
				</table>
			)}
		</React.Fragment>
	);
}

export default ScheduleTable;
