import { Driver, ScheduleEdit } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { useImmer } from "use-immer";
import { GET, POST } from "../../api";
import { authTokenAtom } from "../../stores/utility.store";
import LoadingPlaceholder from "../util/LoadingPlaceholder";
import YesNoPrompt from "../util/YesNoPrompt";
import ScheduleEditModeTable from "./ScheduleEditModeTable";

const start = new Date("2022-01-01");

function ScheduleEditMode() {
	const [token] = useAtom(authTokenAtom);

	const [schedule, setSchedule] = useImmer<ScheduleEdit | undefined>(undefined);
	const [date, setDate] = React.useState(start);

	React.useEffect(() => {
		async function fetchData() {
			const year = start.getFullYear();
			const calendarRes = await GET(
				"/auth/calendar/edit?start=" +
					dayjs(date).format("YYYY-MM-DD") +
					"&end=" +
					dayjs(date).add(1, "year").subtract(1, "day").format("YYYY-MM-DD"),
				token
			);
			setSchedule(await calendarRes.json());
		}

		fetchData();
	}, [setSchedule, date, token]);

	return (
		<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
			<div className="panel">
				<YesNoPrompt
					trigger={<button style={{ marginLeft: 10, color: "green" }}>Speichern</button>}
					header="Speichern"
					content="Wollen Sie wirklich speichern?"
					onYes={async () => {
						await POST("/auth/calendar/edit?date=" + dayjs(start).format("YYYY-MM-DD"), schedule, token!);
					}}
				/>
			</div>

			{schedule === undefined ? (
				<LoadingPlaceholder />
			) : (
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
						<h3>Fahrer</h3>
						{schedule.drivers.map((driver) => {
							return (
								<div style={{ borderBottom: "solid 1px", backgroundColor: "white" }} key={driver.id}>
									{driver.name}
								</div>
							);
						})}
					</div>

					<div className="panel" style={{ width: "70vw", overflowX: "scroll" }}>
						<ScheduleEditModeTable
							date={date}
							setDate={setDate}
							schedule={schedule}
							setSchedule={setSchedule}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

export default ScheduleEditMode;
