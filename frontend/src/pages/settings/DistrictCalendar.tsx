import { DistrictCalendar as DistrictCalendarInfo } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { useImmer } from "use-immer";
import { GET, PUT } from "../../api";
import DistrictsTable from "../../components/schedule/DistrictsTable";
import LoadingPlaceholder from "../../components/util/LoadingPlaceholder";
import YesNoPrompt from "../../components/util/YesNoPrompt";
import { authTokenAtom } from "../../stores/utility.store";

const startDate = dayjs(new Date()).set("month", 0).set("date", 1).toDate();

function DistrictCalendar() {
	const [date, setDate] = React.useState(startDate);
	const [calendar, setCalendar] = useImmer<DistrictCalendarInfo | undefined>(undefined);
	const [token] = useAtom(authTokenAtom);

	React.useEffect(() => {
		async function fetchData() {
			const response = await GET<DistrictCalendarInfo>(
				"/auth/calendar/districts?start=" +
					dayjs(date).format("YYYY-MM-DD") +
					"&end=" +
					dayjs(date).add(1, "year").subtract(1, "day").format("YYYY-MM-DD"),
				token!
			);
			setCalendar(response.data);
		}

		fetchData();
	}, [setCalendar, date, token]);

	return (
		<>
			{calendar === undefined ? (
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
								await PUT("/auth/calendar/districts?year=" + date.getFullYear(), calendar, token!);
							}}
						/>
					</div>

					<div className="panel" style={{ width: "70vw", overflowX: "scroll", paddingLeft: 0 }}>
						<DistrictsTable date={date} setDate={setDate} calendar={calendar} setCalendar={setCalendar} />
					</div>
				</div>
			)}{" "}
		</>
	);
}

export default DistrictCalendar;
