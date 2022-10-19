import { Driver } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import { authTokenAtom } from "../../stores/utility.store";
import LoadingPlaceholder from "../util/LoadingPlaceholder";
import ScheduleTable from "./ScheduleTable";

const startDate = dayjs(new Date()).set("day", 1).toDate();

function ScheduleViewMode() {
	const [token] = useAtom(authTokenAtom);

	const [drivers, setDrivers] = React.useState<Driver[] | undefined>();
	const [date, setDate] = React.useState(startDate);

	React.useEffect(() => {
		async function fetchData() {
			const res = await GET("/auth/calendar/drivers", token!);
			const data = await res.json();
			setDrivers(data);
		}

		fetchData();
	}, [setDrivers, token]);

	return (
		<div className="page">
			{drivers ? (
				<div>
					<div className="panel">
						<ScheduleTable date={date} setDate={setDate} drivers={drivers} />
					</div>
				</div>
			) : (
				<LoadingPlaceholder />
			)}
		</div>
	);
}

export default ScheduleViewMode;
