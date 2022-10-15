import dayjs from "dayjs";
import React from "react";
import WeekSelection from "../components/timeframe/WeekSelection";
import { weekdays } from "../consts";
// import { Schedule } from "backend/src/models/schedule.model";
import { SimpleVendor } from "backend/src/models/vendors.model";
import { GET, POST } from "../api";
import { useAtom } from "jotai";
import { authTokenAtom } from "../stores/utility.store";
import YearSelection from "../components/timeframe/YearSelection";
import YesNoPrompt from "../components/util/YesNoPrompt";
import ScheduleTable from "../components/schedule/ScheduleTable";
import ScheduleEditMode from "../components/schedule/ScheduleEditMode";

const weekStart = new Date("2022-01-01");

function Schedule() {
	const [vendors, setVendors] = React.useState<SimpleVendor[] | undefined>(undefined);
	const [token] = useAtom(authTokenAtom);
	const [date, setDate] = React.useState(weekStart);

	React.useEffect(() => {
		async function fetchData() {
			const res = await GET("/auth/vendors?simple=true", token);
			const data = await res.json();
			setVendors(data);
		}

		fetchData();
	}, [setVendors, token]);

	return (
		<div className="page">
			{vendors === undefined ? (
				<div>Laden...</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
					{/* <div className="panel">
						Jahr <YearSelection date={date} setDate={setDate} />
					</div> */}

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

						<div className="panel" style={{ width: "70vw", overflowX: "scroll" }}>
							<ScheduleEditMode />
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default Schedule;
