import { ChangedCalendarEntry, ScheduleEdit } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { useImmer } from "use-immer";
import { GET, POST } from "../api";
import { authTokenAtom } from "../stores/utility.store";
import LoadingPlaceholder from "../components/util/LoadingPlaceholder";
import YesNoPrompt from "../components/util/YesNoPrompt";
import CalendarTable from "../components/schedule/CalendarTable";

const start = dayjs(new Date()).set("month", 0).set("date", 1).toDate();

function Calendar() {
	const [token] = useAtom(authTokenAtom);

	const [schedule, setSchedule] = useImmer<ScheduleEdit | undefined>(undefined);
	const [date, setDate] = React.useState(start);
	const [changedEntries, setChangedEntries] = useImmer<ChangedCalendarEntry[]>([]);

	React.useEffect(() => {
		async function fetchData() {
			const calendarRes = await GET<ScheduleEdit>(
				"/auth/plan/calendar/edit?start=" +
					dayjs(date).format("YYYY-MM-DD") +
					"&end=" +
					dayjs(date).add(1, "year").subtract(1, "day").format("YYYY-MM-DD"),
				token
			);

			setSchedule(calendarRes.data);
		}

		fetchData();
	}, [setSchedule, date, token]);

	return (
		<div className="page" style={{ padding: 10 }}>
			{schedule === undefined ? (
				<LoadingPlaceholder />
			) : (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 10,
						maxWidth: "100%",
					}}
				>
					<div className="panel">
						<YesNoPrompt
							trigger={<button style={{ marginLeft: 10, color: "green" }}>Speichern</button>}
							header="Speichern"
							content="Wollen Sie wirklich speichern?"
							onYes={async () => {
								await POST(
									"/auth/plan/calendar/edit?date=" + dayjs(start).format("YYYY-MM-DD"),
									changedEntries,
									token!
								);
							}}
						/>
					</div>

					<div className="panel" style={{ width: "90%", overflowX: "scroll", paddingLeft: 0 }}>
						<CalendarTable
							date={date}
							setDate={setDate}
							schedule={schedule}
							setSchedule={setSchedule}
							changedEntries={changedEntries}
							setChangedEntries={setChangedEntries}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

export default Calendar;
