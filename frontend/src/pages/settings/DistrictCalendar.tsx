import { DistrictActivity, DistrictCalendar as DistrictCalendarInfo } from "backend/src/models/schedule.model";
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

export interface ChangedEntry {
	date: string;
	districtId: number;
	activity: DistrictActivity;
}

function DistrictCalendar() {
	const [date, setDate] = React.useState(startDate);
	const [calendar, setCalendar] = useImmer<DistrictCalendarInfo | undefined>(undefined);
	const [token] = useAtom(authTokenAtom);
	const [changedEntries, setChangedEntries] = useImmer<ChangedEntry[]>([]);

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
		<div className="page" style={{ padding: 10 }}>
			{calendar === undefined ? (
				<LoadingPlaceholder />
			) : (
				<div
					style={{
						display: "flex",
						maxWidth: "100%",
						flexDirection: "column",
						alignItems: "center",
						gap: 10,
					}}
				>
					<div className="panel">
						<YesNoPrompt
							trigger={<button style={{ marginLeft: 10, color: "green" }}>Speichern</button>}
							header="Speichern"
							content="Wollen Sie wirklich speichern?"
							onYes={async () => {
								await PUT("/auth/calendar/districts", changedEntries, token!);
							}}
						/>
					</div>

					<div className="panel" style={{ width: "90%", overflowX: "scroll", paddingLeft: 0 }}>
						<DistrictsTable
							date={date}
							setDate={setDate}
							calendar={calendar}
							setCalendar={setCalendar}
							changedEntries={changedEntries}
							setChangedEntries={setChangedEntries}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

export default DistrictCalendar;
