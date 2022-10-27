import { District, Driver, ScheduleEdit } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import Popup from "reactjs-popup";
import { Updater, useImmer } from "use-immer";
import { GET, POST, PUT } from "../api";
import { activities } from "../consts";
import { authTokenAtom } from "../stores/utility.store";
import LoadingPlaceholder from "../components/util/LoadingPlaceholder";
import YesNoPrompt from "../components/util/YesNoPrompt";
import CalendarTable from "../components/schedule/CalendarTable";
import DistrictsTable from "../components/schedule/DistrictsTable";

const start = new Date("2022-01-01");

function Calendar() {
	const [token] = useAtom(authTokenAtom);

	const [schedule, setSchedule] = useImmer<ScheduleEdit | undefined>(undefined);
	const [date, setDate] = React.useState(start);

	React.useEffect(() => {
		async function fetchData() {
			const calendarRes = await GET<ScheduleEdit>(
				"/auth/calendar/edit?start=" +
					dayjs(date).format("YYYY-MM-DD") +
					"&end=" +
					dayjs(date).add(1, "year").subtract(1, "day").format("YYYY-MM-DD"),
				token
			);
			const newSchedule = calendarRes.data;

			setSchedule(newSchedule);
		}

		fetchData();
	}, [setSchedule, date, token]);

	return (
		<>
			{schedule === undefined ? (
				<LoadingPlaceholder />
			) : (
				<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
					<div className="panel">
						{/* <div style={{ textAlign: "center", marginBottom: 10 }}> */}
						<YesNoPrompt
							trigger={<button style={{ marginLeft: 10, color: "green" }}>Speichern</button>}
							header="Speichern"
							content="Wollen Sie wirklich speichern?"
							onYes={async () => {
								await POST(
									"/auth/calendar/edit?date=" + dayjs(start).format("YYYY-MM-DD"),
									schedule,
									token!
								);
							}}
						/>
					</div>

					<div className="panel" style={{ width: "70vw", overflowX: "scroll", paddingLeft: 0 }}>
						<CalendarTable date={date} setDate={setDate} schedule={schedule} setSchedule={setSchedule} />
					</div>

					<div className="panel" style={{ width: "70vw", overflowX: "scroll", paddingLeft: 0 }}>
						<DistrictsTable />
					</div>
				</div>
			)}
		</>
	);
}

export default Calendar;
