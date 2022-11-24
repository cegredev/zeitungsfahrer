import { Driver } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET, GET_BLOB } from "../api";
import { normalizeDate } from "../consts";
import { authTokenAtom } from "../stores/utility.store";
import LoadingPlaceholder from "../components/util/LoadingPlaceholder";
import ScheduleTable from "../components/schedule/ScheduleTable";
import YearSelection from "../components/time/YearSelection";
import WeekSelection, { getKW } from "../components/time/WeekSelection";
import { downloadUrl } from "../files";

const startDate = dayjs(normalizeDate(new Date())).set("day", 1).toDate();

function Schedule() {
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
		<div className="page" style={{ gap: 10 }}>
			<h3 className="panel" style={{ display: "flex", flexDirection: "row", gap: 10 }}>
				<div>
					Jahr:{" "}
					<YearSelection
						date={date}
						setDate={(date) => {
							setDate(dayjs(date).day(1).toDate());
						}}
					/>
				</div>
				<div>
					KW: <WeekSelection date={date} setDate={setDate} />
				</div>
				<div>
					<button
						onClick={async () => {
							const res = await GET_BLOB(
								"/auth/calendar/view/excel?start=" + dayjs(date).format("YYYY-MM-DD"),
								token!
							);

							const fileUrl = URL.createObjectURL(res.data);

							downloadUrl(fileUrl, "Einsatzplan KW " + getKW(date) + ".xlsx");
						}}
					>
						Excel
					</button>
				</div>
			</h3>
			{drivers ? (
				<div className="panel">
					<ScheduleTable date={date} setDate={setDate} drivers={drivers} />
				</div>
			) : (
				<LoadingPlaceholder />
			)}
		</div>
	);
}

export default Schedule;
