import { Driver } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import { normalizeDate } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import LoadingPlaceholder from "../util/LoadingPlaceholder";
import ScheduleViewTable from "./ScheduleViewTable";

const startDate = dayjs(normalizeDate(new Date())).set("day", 1).toDate();

function ScheduleViewMode() {
	const [token] = useAtom(authTokenAtom);

	const [drivers, setDrivers] = React.useState<Driver[] | undefined>();
	const [date, setDate] = React.useState(startDate);

	React.useEffect(() => {
		async function fetchData() {
			const res = await GET<Driver[]>("/auth/calendar/drivers", token!);
			setDrivers(res.data);
		}

		fetchData();
	}, [setDrivers, token]);

	return (
		<div className="page">
			{drivers ? (
				<div className="panel">
					<ScheduleViewTable date={date} setDate={setDate} drivers={drivers} />
				</div>
			) : (
				<LoadingPlaceholder />
			)}
		</div>
	);
}

export default ScheduleViewMode;
