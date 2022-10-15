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

export async function getCalendarEdit(start: Date, end: Date): Promise<ScheduleEdit> {
	const startDay = dayOfYear(start) - 1,
		endDay = dayOfYear(end) - 1,
		numDays = endDay - startDay + 1;

	const drivers = await getDrivers();
	const districts = (await poolExecute<{ id: number }>("SELECT id FROM districts")).map((d) => d.id);
	const driverIndexes = new Map<number, number>();
	drivers.forEach((v, i) => driverIndexes.set(v.id, i));

	const calendarEntries = await poolExecute<{
		activity: Activity;
		district: number;
		driverId: number;
		date: number;
	}>(
		`
		SELECT driver_id as driverId, date, activity, district
		FROM calendar
		WHERE (date BETWEEN ? AND ?) AND year=?`,
		[startDay, endDay, start.getFullYear()]
	);

	const calendar: ScheduleEntry[][] = Array(drivers.length)
		.fill(null)
		.map(() => Array(numDays).fill({ activity: 1 }));

	for (const entry of calendarEntries) {
		calendar[driverIndexes.get(entry.driverId)!][entry.date] = {
			activity: entry.activity,
			district: entry.district,
		};
	}

	return {
		calendar,
		drivers,
		districts,
	};
}

export async function getCalendarView(start: Date, end: Date): Promise<ScheduleView> {
	const startDay = dayOfYear(start) - 1;
	const endDay = dayOfYear(end) - 1;
	const numDays = endDay - startDay + 1;

	const districts = await poolExecute<District>("SELECT id, default_vendor as defaultVendor FROM districts");
	const vendors = await poolExecute<{ id: number; name: string }>("SELECT id, last_name as name FROM vendors");
	const vendorMap = new Map<number, string>();
	for (const vendor of vendors) vendorMap.set(vendor.id, vendor.name);

	const calendarEntries = await poolExecute<{
		activity: number;
		district: number;
		vendorId: number;
		dayOfYear: number;
	}>(
		`
		SELECT vendor_id as vendorId, date as dayOfYear, activity, district
		FROM calendar
		WHERE (date BETWEEN ? AND ?) AND year=?`,
		[startDay, endDay, start.getFullYear()]
	);

	const districtMap = new Map<number, DistrictWeek>();
	for (const district of districts) {
		districtMap.set(district.id, {
			district,
			vendorIds: Array(numDays).fill(-2),
		});
	}

	const vacations: number[][] = Array(numDays)
		.fill(null)
		.map(() => []);
	const free: number[][] = Array(numDays)
		.fill(null)
		.map(() => []);
	const sick: number[][] = Array(numDays)
		.fill(null)
		.map(() => []);

	for (const { activity, district, dayOfYear, vendorId } of calendarEntries) {
		switch (activity) {
			case 0: // Working in specific (manually set) district
				districtMap.get(district)!.vendorIds[dayOfYear] = vendorId;
				break;
			case 1: // Free
				free[dayOfYear].push(vendorId);
				break;
			case 2: // Vacation
				vacations[dayOfYear].push(vendorId);
				break;
			case 3: // Sick
				sick[dayOfYear].push(vendorId);
				break;
		}
	}

	for (const arr of [free, vacations, sick]) {
		for (const day of arr) {
			day.sort((a, b) => vendorMap.get(a)!.localeCompare(vendorMap.get(b)!));
		}
	}

	return {
		districts: [...districtMap.values()],
		vacation: vacations,
		free,
		sick,
	};
}

export async function updateSchedule(date: Date, schedule: ScheduleView): Promise<RouteReport> {
	let query = "REPLACE INTO calendar (vendor_id, day_of_year, year, district) VALUES ";

	for (const district of schedule.districts) {
		let day = dayOfYear(date) - 1;

		for (const vendorId of district.vendorIds) {
			if (vendorId !== -1) query += `(${vendorId}, ${day}, ${date.getFullYear()}, ${district.district.id}),`;
			day++;
		}
	}

	for (const vendorIds of schedule.vacation) {
		let day = dayOfYear(date) - 1;

		for (const vendorId of vendorIds) {
			if (vendorId !== -1) query += `(${vendorId}, ${day}, ${date.getFullYear()}, NULL),`;
			day++;
		}
	}

	query = query.substring(0, query.length - 1);

	await pool.execute(query);

	return {
		code: 201,
	};
}

export async function getDrivers(): Promise<Driver[]> {
	return await poolExecute<Driver>("SELECT * FROM drivers");
}
