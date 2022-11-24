import dayjs from "dayjs";
import { DATE_FORMAT } from "../consts.js";
import pool, { RouteReport } from "../database.js";
import {
	Activity,
	ChangedCalendarEntry,
	District,
	DistrictActivity,
	DistrictCalendar,
	DistrictCalendarEntry,
	DistrictWeek,
	Driver,
	EditedDriver,
	FullCalendarEntry,
	ScheduleEdit,
	ScheduleEntry,
	ScheduleView,
} from "../models/schedule.model.js";
import { daysBetween } from "../time.js";
import { dayOfYear, poolExecute } from "../util.js";
import ExcelJS from "exceljs";

interface CalendarEntry {
	activity: Activity;
	district: number;
	driverId: number;
	date: Date;
}

export async function getCalendar(start: Date, end: Date): Promise<ScheduleEdit> {
	const numDays = daysBetween(start, end) + 1;

	const drivers = await getDrivers();
	const driverIndexes = new Map<number, number>(drivers.map((d, i) => [d.id, i]));

	const districts = await poolExecute<District>("SELECT id, custom_id as customId FROM districts");

	const calendarEntries = await poolExecute<CalendarEntry>(
		`
		SELECT driver_id as driverId, date, activity, district
		FROM calendar
		WHERE date BETWEEN ? AND ?`,
		[dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
	);

	const calendar: ScheduleEntry[][] = Array(drivers.length)
		.fill(null)
		.map((_, driverIndex) => Array(numDays).fill({ activity: 0, district: drivers[driverIndex].defaultDistrict }));

	for (const entry of calendarEntries) {
		calendar[driverIndexes.get(entry.driverId)!][dayOfYear(entry.date) - 1] = {
			activity: entry.activity,
			district: entry.district,
		};
	}

	return {
		calendar,
		drivers,
		districts: districts.sort((a, b) => a.id - b.id),
	};
}

export async function getSchedule(start: Date, end: Date): Promise<ScheduleView> {
	const numDays = daysBetween(start, end) + 1;

	const drivers = await getDrivers();
	const driverMap = new Map(drivers.map((driver) => [driver.id, driver]));
	const allDistricts = await poolExecute<District>("SELECT id, custom_id as customId FROM districts");
	const calendarEntries = await poolExecute<CalendarEntry>(
		`
		SELECT driver_id as driverId, date, activity, district
		FROM calendar
		WHERE date BETWEEN ? AND ?`,
		[dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
	);
	const districtCalendar = await getDistrictCalendarEntriesRaw(start, end);

	const districtMap = new Map<number, DistrictWeek>();
	for (const district of allDistricts) {
		districtMap.set(district.id, {
			district,
			drivers: Array(numDays).fill({ id: -1 }),
		});
	}

	const sections = [1, 2, 3, 4].map(() =>
		Array(numDays)
			.fill(null)
			.map<number[]>(() => [])
	);
	const [free, vacation, sick, plus] = sections;

	for (const entry of districtCalendar) {
		if (entry.activity === 1) {
			const index = daysBetween(start, entry.date);
			const drivers = districtMap.get(entry.districtId)!.drivers;

			const oldDriver = drivers[index].id;
			if (oldDriver >= 0) {
				sections[0][index].push(oldDriver);
			}
			drivers[index] = { id: -2 };
		}
	}

	for (const { activity, district, date, driverId } of calendarEntries) {
		const index = daysBetween(start, date);
		const drivers = districtMap.get(district)?.drivers;

		switch (activity) {
			case 0: // Working in specific (manually set) district
				drivers![index] = { id: driverId };
				break;
			case 1:
			case 2:
			case 3:
			case 4:
				sections[activity - 1][index].push(driverId);
				break;
		}
	}

	// Sort by name
	for (const section of sections) {
		for (const day of section) {
			day.sort((a, b) => driverMap.get(a)!.name.localeCompare(driverMap.get(b)!.name));
		}
	}

	return {
		districts: [...districtMap.values()].sort((a, b) => a.district.id - b.district.id),
		free,
		vacation,
		sick,
		plus,
		drivers,
	};
}

export async function createScheduleExcel(start: Date): Promise<ExcelJS.Workbook> {
	const schedule = await getSchedule(start, dayjs(start).add(5, "days").toDate());

	const workbook = new ExcelJS.Workbook();

	const plan = workbook.addWorksheet("Plan", {
		pageSetup: {
			paperSize: 9,
			orientation: "landscape",
			showGridLines: true,
		},
	});

	plan.columns = [0, 1, 2, 3, 4, 5, 6].map(() => ({
		width: 15,
	}));

	let currentRow = 1;

	const headerRows = [
		["", ...[0, 1, 2, 3, 4, 5].map((day) => dayjs(start).add(day, "days").toDate())],
		["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
	];

	plan.insertRow(currentRow++, headerRows[0]);
	plan.insertRow(currentRow++, ["Bericht", ...headerRows[1]]);
	plan.getCell(2, 1).style = { font: { bold: true } };

	const driverMap = new Map((await getDrivers()).map((driver) => [driver.id, driver.name]));

	schedule.districts.forEach(({ district, drivers }) => {
		plan.insertRow(currentRow++, [district.customId, ...drivers.map((driver) => driverMap.get(driver.id) || "-")]);
	});

	const unset = workbook.addWorksheet("Frei", {
		pageSetup: {
			paperSize: 9,
			orientation: "landscape",
			showGridLines: true,
		},
	});

	unset.columns = [0, 1, 2, 3, 4, 5, 6].map(() => ({
		width: 15,
	}));

	currentRow = 1;

	unset.insertRow(currentRow++, headerRows[0]);
	unset.insertRow(currentRow++, ["", ...headerRows[1]]);

	unset.getCell("B1:G2").style = {
		font: {
			bold: true,
		},
	};

	const addSection = (name: string, color: string, invertTextColor: boolean, row: number, data: number[][]) => {
		unset.insertRow(row++, [name]);

		unset.getCell(row - 1, 1).style = {
			font: {
				color: invertTextColor ? { argb: "FFFFFFFF" } : { argb: "FF000000" },
				bold: true,
			},
			fill: {
				type: "pattern",
				pattern: "solid",
				fgColor: {
					argb: color,
				},
			},
		};

		const maxDrivers = Math.max(...data.map((column) => column.length));

		const rows = Array(maxDrivers)
			.fill(null)
			.map(() => Array<string>(6).fill(""));

		data.forEach((column, i) => {
			column.forEach((id, j) => {
				rows[j][i] = driverMap.get(id)!;
			});
		});

		for (const rowData of rows) {
			unset.insertRow(row++, rowData);
		}

		return row;
	};

	for (const section of [
		{ name: "Planfrei", color: "FFFFFF00", invertTextColor: false, data: schedule.free },
		{ name: "Urlaub", color: "FF00FF00", invertTextColor: false, data: schedule.vacation },
		{ name: "Krank", color: "FFFF0000", invertTextColor: true, data: schedule.sick },
		{ name: "Plus", color: "FF0000FF", invertTextColor: true, data: schedule.plus },
	]) {
		currentRow = addSection(section.name, section.color, section.invertTextColor, currentRow, section.data);
	}

	for (let column = 2; column <= 7; column++) {
		for (let row = 1; row <= 2; row++) {
			for (const sheet of [plan, unset]) {
				sheet.getCell(row, column).style = {
					font: {
						bold: true,
					},
				};
			}
		}
	}

	return workbook;
}

export async function updateCalendar(entries: ChangedCalendarEntry[]): Promise<RouteReport> {
	for (const { date, driverId, activity, districtId } of entries) {
		await poolExecute("REPLACE INTO calendar (driver_id, date, activity, district) VALUES (?, ?, ?, ?)", [
			driverId,
			date,
			activity,
			districtId || null,
		]);
	}

	return {
		code: 201,
	};
}

export async function updateCalendarEntry(entry: FullCalendarEntry): Promise<RouteReport> {
	const sqlDistrict = entry.district || null;

	await poolExecute(
		`INSERT INTO calendar (driver_id, date, activity, district) VALUES (?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE activity=?, district=?`,
		[entry.driverId, entry.date, entry.activity, sqlDistrict, entry.activity, sqlDistrict]
	);

	return {
		code: 200,
	};
}

export async function deleteCalendarEntry(entry: FullCalendarEntry): Promise<RouteReport> {
	await poolExecute("DELETE FROM calendar WHERE driver_id=? AND date=?", [entry.driverId, `"${entry.date}"`]);

	return {
		code: 200,
	};
}

async function getDistrictCalendarEntriesRaw(start: Date, end: Date): Promise<DistrictCalendarEntry[]> {
	return await poolExecute<DistrictCalendarEntry>(
		`
		SELECT district_id as districtId, date, activity FROM district_calendar
		WHERE date BETWEEN ? AND ?
	`,
		[dayjs(start).format(DATE_FORMAT), dayjs(end).format(DATE_FORMAT)]
	);
}

export async function getDistrictCalendar(start: Date, end: Date): Promise<DistrictCalendar> {
	const districts = await poolExecute<{ id: number; customId: number }>(
		"SELECT id, custom_id as customId FROM districts ORDER BY id"
	);
	const districtMap = new Map<number, number>(districts.map((district, i) => [district.id, i]));

	const entries = await getDistrictCalendarEntriesRaw(start, end);

	const calendar = Array(districts.length)
		.fill(null)
		.map(() => Array(daysBetween(start, end) + 1).fill(0));
	for (const { districtId, activity, date } of entries) {
		const row = districtMap.get(districtId)!;

		calendar[row][daysBetween(start, date)] = activity;
	}

	return {
		districts,
		calendar,
	};
}

export async function addDistrict(customId: number): Promise<{ id: number }> {
	const response = await pool.execute("INSERT INTO districts (custom_id) VALUES (?)", [customId]);

	// @ts-ignore
	const id: number = response[0].insertId;

	return { id };
}

export async function updateDistrictCalendar(entries: DistrictCalendarEntry[]) {
	for (const { districtId, date, activity } of entries) {
		await poolExecute(
			`INSERT INTO district_calendar (district_id, date, activity) VALUES (?, ?, ?)
			ON DUPLICATE KEY UPDATE activity=?
		`,
			[districtId, dayjs(date).format(DATE_FORMAT), activity, activity]
		);
	}
}

export async function updateDistrict(id: number, customId: number): Promise<RouteReport> {
	await poolExecute("UPDATE districts SET custom_id=? WHERE id=?", [customId, id]);

	return {
		code: 200,
	};
}

export async function deleteDistrict(id: number): Promise<RouteReport> {
	await poolExecute("DELETE FROM districts WHERE id=?", [id]);

	return {
		code: 200,
	};
}

export async function getDrivers(): Promise<Driver[]> {
	return await poolExecute<Driver>("SELECT id, name, default_district as defaultDistrict FROM drivers");
}

export async function addDriver(name: string, defaultDistrict: number): Promise<RouteReport> {
	const res = await pool.execute("INSERT INTO drivers (name, default_district) VALUES (?, ?)", [
		name,
		defaultDistrict,
	]);

	return {
		code: 201,
		body: {
			// @ts-ignore
			id: res[0].insertId,
		},
	};
}

export async function updateDriver(driver: EditedDriver): Promise<RouteReport> {
	await poolExecute("UPDATE drivers SET name=?, default_district=? WHERE id=?", [
		driver.name,
		driver.defaultDistrict,
		driver.id,
	]);

	if (driver.oldDefault) {
		await poolExecute("UPDATE calendar SET district=? WHERE driver_id=? AND district=? AND YEAR(date)=?", [
			driver.defaultDistrict,
			driver.id,
			driver.oldDefault,
			new Date().getFullYear(),
		]);
	}

	return {
		code: 200,
	};
}

export async function deleteDriver(id: number): Promise<RouteReport> {
	await poolExecute("DELETE FROM drivers WHERE id=?", [id]);

	return {
		code: 200,
	};
}
