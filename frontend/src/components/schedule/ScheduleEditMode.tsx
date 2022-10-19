import { Driver, ScheduleEdit } from "backend/src/models/schedule.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { Updater, useImmer } from "use-immer";
import { GET, POST } from "../../api";
import { authTokenAtom } from "../../stores/utility.store";
import LoadingPlaceholder from "../util/LoadingPlaceholder";
import YesNoPrompt from "../util/YesNoPrompt";
import ScheduleEditModeTable from "./ScheduleEditModeTable";

const start = new Date("2022-01-01");

function DriverEditSection({
	schedule,
	setSchedule,
	selectedDriver,
	driverMap,
	setSelectedDriver,
	numDays,
}: {
	schedule: ScheduleEdit;
	setSchedule: Updater<ScheduleEdit | undefined>;
	selectedDriver: Driver;
	driverMap: Map<number, Driver>;
	setSelectedDriver: Updater<Driver>;
	numDays: number;
}) {
	const [token] = useAtom(authTokenAtom);

	const [driverDraft, setDriverDraft] = useImmer<Driver>({
		id: -1,
		name: " ",
		defaultDistrict: 1,
	});

	if (selectedDriver.id !== driverDraft.id) setDriverDraft(selectedDriver);

	const isDraft = selectedDriver.id === -1;

	return (
		<div className="page">
			<input
				type="text"
				value={driverDraft.name}
				onChange={async (evt) => {
					setDriverDraft((draft) => {
						draft.name = evt.target.value;
					});
				}}
			/>

			<select
				value={driverDraft.defaultDistrict}
				onChange={(evt) => {
					setDriverDraft((draft) => {
						draft.defaultDistrict = parseInt(evt.target.value);
					});
				}}
			>
				{schedule.districts.map((district) => (
					<option key={district} value={district}>
						{district}
					</option>
				))}
			</select>

			<YesNoPrompt
				trigger={<button style={{ marginLeft: 10, color: "green" }}>Speichern</button>}
				header="Hinzufügen"
				content="Wollen Sie diesen Fahrer hinzufügen?"
				onYes={async () => {
					if (isDraft) {
						const res = await POST("/auth/calendar/drivers", driverDraft, token!);

						const id = (await res.json()).id;
						setSelectedDriver(id);

						setSchedule((draft) => {
							draft!.drivers.push({ ...driverDraft, id });
							draft!.calendar.push(
								Array(numDays)
									.fill(null)
									.map(() => ({
										activity: 0,
										district: driverDraft.defaultDistrict,
									}))
							);
						});
					} else {
						setSchedule((draft) => {
							const index = draft!.drivers.findIndex((driver) => driver.id === selectedDriver.id);
							draft!.drivers[index] = driverDraft;
						});
					}
				}}
			/>
		</div>
	);
}

function ScheduleEditMode() {
	const numDays = 365;

	const [token] = useAtom(authTokenAtom);

	const [schedule, setSchedule] = useImmer<ScheduleEdit | undefined>(undefined);
	const [date, setDate] = React.useState(start);

	const [selectedDriver, setSelectedDriver] = useImmer<Driver>({ id: -1, name: "", defaultDistrict: 1 });

	const driverMap: Map<number, Driver> = React.useMemo(
		() =>
			new Map(
				(schedule?.drivers || [])
					.concat({ id: -1, name: "Neu", defaultDistrict: schedule?.districts[0] || -1 })
					.map((driver) => [driver.id, driver])
			),
		[schedule]
	);

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
						<div style={{ textAlign: "center", marginBottom: 10 }}>
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

						<DriverEditSection
							driverMap={driverMap}
							selectedDriver={selectedDriver!}
							numDays={numDays}
							schedule={schedule}
							setSchedule={setSchedule}
							setSelectedDriver={setSelectedDriver}
						/>
					</div>

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
							{[...driverMap.values()].map((driver) => {
								return (
									<div
										style={{
											borderBottom: "solid 1px",
											backgroundColor: "white",
											cursor: "default",
										}}
										key={driver.id}
										onClick={() => setSelectedDriver(driver)}
									>
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
				</div>
			)}
		</>
	);
}

export default ScheduleEditMode;
