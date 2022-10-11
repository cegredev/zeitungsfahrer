import { ScheduleInfo } from "backend/src/models/schedule.model";
import { SimpleVendor } from "backend/src/models/vendors.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { useImmer } from "use-immer";
import { GET, POST } from "../../api";
import { weekdays } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
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

	const [schedule, setSchedule] = useImmer<ScheduleInfo | undefined>(undefined);

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
						<tr>
							<th>Bezirk</th>
							{Array(365)
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

														setSchedule((draft) => {
															const district = draft!.districts[districtIndex];
															const oldId = district.vendorIds[day];
															district.vendorIds[day] = newVendorId;

															if (
																oldId !== -1 &&
																!draft!.districts.find(
																	(district) => district.vendorIds[day] === oldId
																)
															) {
																draft!.free[day].push(oldId);
															}

															for (const ids of [
																draft?.free[day],
																draft?.vacation[day],
															]) {
																const index = ids!.findIndex(
																	(id) => id === newVendorId
																);
																if (index === -1) continue;

																ids?.splice(index, 1);
															}
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
									<td style={{ verticalAlign: "top" }} key={"schedule-free-" + i}>
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
									<td style={{ verticalAlign: "top" }} key={"schedule-vacation-" + day}>
										{vendorIds.map((id, j) => (
											<div
												key={"schedule-vacation-" + day + "-" + j}
												style={{ whiteSpace: "nowrap" }}
											>
												{vendorMap.get(id)!.name}
												<button
													onClick={() => {
														setSchedule((draft) => {
															draft!.vacation[day].splice(
																draft!.vacation[day].findIndex((_id) => _id === id),
																1
															);
															draft!.free[day].push(id);
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
												setSchedule((draft) => {
													draft!.free[day].splice(
														draft!.free[day].findIndex((id) => id === v.id),
														1
													);
													draft!.vacation[day].push(v.id);
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
