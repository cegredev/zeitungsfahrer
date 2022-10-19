import pool, { RouteReport } from "../database.js";
import {
	Activity,
	District,
	DistrictWeek,
	Driver,
	ScheduleEdit,
	ScheduleEntry,
	ScheduleView,
} from "../models/schedule.model.js";
import { dayOfYear, poolExecute } from "../util.js";
import { getVendorsSimple } from "./vendors.service.js";

interface FullCalendarEntry {
	activity: Activity;
	district: number;
	driverId: number;
	date: number;
}

export async function getCalendarEdit(start: Date, end: Date): Promise<ScheduleEdit> {
	const startDay = dayOfYear(start) - 1,
		endDay = dayOfYear(end) - 1,
		numDays = endDay - startDay + 1;

	const drivers = await getDrivers();
	const driverIndexes = new Map<number, number>(drivers.map((d, i) => [d.id, i]));

	const districts = (await poolExecute<{ id: number }>("SELECT id FROM districts")).map((d) => d.id);

	const calendarEntries = await poolExecute<FullCalendarEntry>(
		`
		SELECT driver_id as driverId, date, activity, district
		FROM calendar
		WHERE (date BETWEEN ? AND ?) AND year=?`,
		[startDay, endDay, start.getFullYear()]
	);

	const calendar: ScheduleEntry[][] = Array(drivers.length)
		.fill(null)
		.map((_, driverIndex) => Array(numDays).fill({ activity: 0, district: drivers[driverIndex].defaultDistrict }));

	for (const entry of calendarEntries) {
		calendar[driverIndexes.get(entry.driverId)!][entry.date] = {
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

export async function getCalendarView(start: Date, end: Date): Promise<ScheduleView> {
	const startDay = dayOfYear(start) - 1,
		endDay = dayOfYear(end) - 1,
		numDays = endDay - startDay + 1;

	const drivers = await getDrivers();
	const driverMap = new Map(drivers.map((driver) => [driver.id, driver]));
	const allDistricts = (await poolExecute<{ id: number }>("SELECT id FROM districts")).map((d) => d.id);
	const calendarEntries = await poolExecute<FullCalendarEntry>(
		`
		SELECT driver_id as driverId, date, activity, district
		FROM calendar
		WHERE (date BETWEEN ? AND ?) AND year=?`,
		[startDay, endDay, start.getFullYear()]
	);

	const districtMap = new Map<number, DistrictWeek>();
	for (const district of allDistricts) {
		districtMap.set(district, {
			district,
			drivers: Array(numDays).fill(-1),
		});
	}

	const sections = [1, 2, 3, 4].map(() =>
		Array(numDays)
			.fill(null)
			.map<number[]>(() => [])
	);
	const [free, vacation, sick, plus] = sections;

	for (const { activity, district, date, driverId } of calendarEntries) {
		const index = date - startDay;

		switch (activity) {
			case 0: // Working in specific (manually set) district
				districtMap.get(district)!.drivers[index] = driverId;
				break;
			case 5:
				vacation[index].push(driverId);

				const drivers = districtMap.get(driverMap.get(driverId)!.defaultDistrict)!.drivers!;
				if (drivers[index] === -1) drivers[index] = -2;
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

	console.log(schedule.drivers);

	const year = date.getFullYear(),
		startDay = date.getDay();

	// FIXME: Only works from jan-01

	let query = "REPLACE INTO calendar (driver_id, date, year, activity, district) VALUES ";

	schedule.calendar.forEach((row, index) => {
		const driverId = schedule.drivers[index].id;

		row.forEach((entry, date) => {
			query += `(${[driverId, date, year, entry.activity, entry.district || "NULL"].join(",")}),`;
		});
	});

	query = query.substring(0, query.length - 1);

	await pool.execute(query);

	return {
		code: 201,
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

export async function updateDriver(driver: Driver): Promise<RouteReport> {
	await poolExecute("UPDATE drivers SET name=?, default_district=? WHERE id=?", [
		driver.name,
		driver.defaultDistrict,
		driver.id,
	]);

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
