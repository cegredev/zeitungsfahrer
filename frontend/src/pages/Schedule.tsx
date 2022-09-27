import dayjs from "dayjs";
import React from "react";
import WeekSelection from "../components/timeframe/WeekSelection";
import { weekdays } from "../consts";
import { ScheduleInfo } from "backend/src/models/schedule.model";
import { SimpleVendor } from "backend/src/models/vendors.model";
import { GET } from "../api";
import { useAtom } from "jotai";
import { authTokenAtom } from "../components/stores/utility.store";

const weekStart = dayjs(new Date()).set("day", 1).toDate();

function Schedule() {
	const [date, setDate] = React.useState(weekStart);
	const [vendors, setVendors] = React.useState<SimpleVendor[] | undefined>(undefined);
	const [token] = useAtom(authTokenAtom);

	const [schedule, setSchedule] = React.useState<ScheduleInfo>({
		districts: [
			{
				vendorIds: [1, 1, 1, 1, 18, 18, 18],
			},
			{
				vendorIds: [29, 29, 1, 29, 29, 18, 18],
			},
			{
				vendorIds: [30, 30, 30, 30, 30, 30, 30],
			},
			{
				vendorIds: [30, 1, 29, 1, 30, 29, 18],
			},
		],
	});

	React.useEffect(() => {
		async function fetchData() {
			const res = await GET("/auth/vendors?simple=true", token);
			const data = await res.json();
			setVendors(data);
		}

		fetchData();
	}, [setVendors]);

	const dateCounter = dayjs(date);

	return (
		<div className="page">
			{vendors === undefined ? (
				<div>Laden...</div>
			) : (
				<table className="schedule-table">
					<thead>
						<tr>
							<th>
								KW <WeekSelection date={date} setDate={setDate} />
							</th>
							{Array(7)
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
						<tr>
							<td>Bezirk</td>
							{weekdays.map((day, i) => (
								<td key={"header-weekday-" + i}>{day}</td>
							))}
						</tr>
						{schedule.districts.map((week, districtIndex) => {
							const districtId = districtIndex + 1;

							return (
								<tr key={"schedule-district-" + districtId}>
									<td>{districtId}</td>
									{week.vendorIds.map((vendorId, weekday) => {
										return (
											<td key={"vendor-row-schedule-" + districtId + "-" + weekday}>
												<select
													value={vendorId}
													onChange={(evt) => {
														const newDistrictWeeks = [...schedule.districts];
														const newVendorIds = [...week.vendorIds];
														newVendorIds[weekday] = parseInt(evt.target.value);
														newDistrictWeeks[districtIndex].vendorIds = newVendorIds;
														setSchedule({ ...schedule, districts: newDistrictWeeks });
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
					</tbody>
				</table>
			)}
		</div>
	);
}

export default Schedule;
