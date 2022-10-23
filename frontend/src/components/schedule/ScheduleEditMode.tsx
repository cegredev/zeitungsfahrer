import { District, Driver, ScheduleEdit } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import Popup from "reactjs-popup";
import { Updater, useImmer } from "use-immer";
import { GET, POST, PUT } from "../../api";
import { activities } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import LoadingPlaceholder from "../util/LoadingPlaceholder";
import YesNoPrompt from "../util/YesNoPrompt";
import ScheduleEditModeTable from "./ScheduleEditModeTable";

const start = new Date("2022-01-01");

function ScheduleEditMode() {
	const numDays = 365;

	const [token] = useAtom(authTokenAtom);

	const [schedule, setSchedule] = useImmer<ScheduleEdit | undefined>(undefined);
	const [date, setDate] = React.useState(start);

	const [selectedDriver, setSelectedDriver] = useImmer<Driver>({ id: -1, name: "", defaultDistrict: 1 });

	React.useEffect(() => {
		async function fetchData() {
			const calendarRes = await GET(
				"/auth/calendar/edit?start=" +
					dayjs(date).format("YYYY-MM-DD") +
					"&end=" +
					dayjs(date).add(1, "year").subtract(1, "day").format("YYYY-MM-DD"),
				token
			);
			const newSchedule = await calendarRes.json();

			setSelectedDriver(newSchedule.drivers[0].id);
			setSchedule(newSchedule);
		}

		fetchData();
	}, [setSchedule, date, setSelectedDriver, token]);

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

					<div style={{ display: "flex", gap: 10, position: "relative" }}>
						<div className="panel" style={{ width: "70vw", overflowX: "scroll", paddingLeft: 0 }}>
							<ScheduleEditModeTable
								date={date}
								setDate={setDate}
								schedule={schedule}
								setSchedule={setSchedule}
							/>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export default ScheduleEditMode;
