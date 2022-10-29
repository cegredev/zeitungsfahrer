import dayjs from "dayjs";
import { DATE_FORMAT } from "../consts.js";
import pool, { RouteReport } from "../database.js";
import {
	Activity,
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

	const districts = (await poolExecute<{ id: number }>("SELECT id FROM districts")).map((d) => d.id);

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
		districts: districts.sort((a, b) => a - b),
	};
}

export async function getSchedule(start: Date, end: Date): Promise<ScheduleView> {
	const numDays = daysBetween(start, end) + 1;

	const drivers = await getDrivers();
	const driverMap = new Map(drivers.map((driver) => [driver.id, driver]));
	const allDistricts = (await poolExecute<{ id: number }>("SELECT id FROM districts")).map((d) => d.id);
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
		districtMap.set(district, {
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

	for (const entry of districtCalendar) {
		if (entry.activity === 1) {
			console.log(entry);

			const index = daysBetween(start, entry.date);
			const drivers = districtMap.get(entry.districtId)?.drivers;

			drivers![index] = { id: -2 };
		}
	}

	// Sort by name
	for (const section of sections) {
		for (const day of section) {
			day.sort((a, b) => driverMap.get(a)!.name.localeCompare(driverMap.get(b)!.name));
		}
	}

	return {
		districts: [...districtMap.values()].sort((a, b) => a.district - b.district),
		free,
		vacation,
		sick,
		plus,
		drivers,
	};
}

export async function updateSchedule(date: Date, schedule: ScheduleEdit): Promise<RouteReport> {
	for (const driver of schedule.drivers) {
		if (driver.id === -1) {
			const response = await pool.execute("INSERT INTO drivers (name, default_district) VALUES (?, ?)", [
				driver.name,
				driver.defaultDistrict,
			]);

			// @ts-ignore
			driver.id = response[0].insertId;
		} else {
			await poolExecute("UPDATE drivers SET name=?, default_district=? WHERE id=?", [
				driver.name,
				driver.defaultDistrict,
				driver.id,
			]);
		}
	}

	const year = date.getFullYear();

	// FIXME: Only works from jan-01
	let query = "REPLACE INTO calendar (driver_id, date, activity, district) VALUES ";

	schedule.calendar.forEach((row, index) => {
		const driverId = schedule.drivers[index].id;

		row.forEach((entry, date) => {
			query += `(${[
				driverId,
				'"' +
					dayjs(new Date(`${year}-01-01`))
						.add(date, "days")
						.format(DATE_FORMAT) +
					'"',
				entry.activity,
				entry.district || "NULL",
			].join(",")}),`;
		});
	});

	query = query.substring(0, query.length - 1);

	await pool.execute(query);

	return {
		code: 201,
	};
}

export async function updateCalendarEntry(entry: FullCalendarEntry): Promise<RouteReport> {
	const sqlDistrict = entry.district || null;

	await poolExecute(
		`INSERT INTO calendar (driver_id, year, date, activity, district) VALUES (?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE activity=?, district=?`,
		[entry.driverId, entry.year, entry.date, entry.activity, sqlDistrict, entry.activity, sqlDistrict]
	);

	return {
		code: 200,
	};
}

export async function deleteCalendarEntry(entry: FullCalendarEntry): Promise<RouteReport> {
	await poolExecute("DELETE FROM calendar WHERE driver_id=? AND year=? AND date=?", [
		entry.driverId,
		entry.year,
		entry.date,
	]);

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
	const districts = (await poolExecute<{ id: number }>("SELECT id FROM districts")).map(({ id }) => id);
	const districtMap = new Map<number, number>(districts.map((districtId, i) => [districtId, i]));

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

export async function addDistrict(): Promise<{ id: number }> {
	const response = await pool.execute("INSERT INTO districts () VALUES ()");

	// @ts-ignore
	const id: number = response[0].insertId;

	return { id };
}

export async function updateDistrictCalendar({ districts, calendar }: DistrictCalendar, year: number) {
	let query = "REPLACE INTO district_calendar (district_id, date, activity) VALUES ";

	calendar.forEach((row, index) => {
		const districtId = districts[index];

		row.forEach((activity, date) => {
			query += `(${[
				districtId,
				'"' +
					dayjs(new Date(`${year}-01-01`))
						.add(date, "days")
						.format(DATE_FORMAT) +
					'"',
				activity,
			].join(",")}),`;
		});
	});

	query = query.substring(0, query.length - 1);

	// console.log(query);

	await pool.execute(query);
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
		await poolExecute("UPDATE calendar SET district=? WHERE driver_id=? AND district=? AND year=?", [
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
