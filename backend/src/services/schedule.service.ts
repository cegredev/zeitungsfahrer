import pool, { RouteReport } from "../database.js";
import { DistrictWeek, ScheduleInfo } from "../models/schedule.model.js";
import { dayOfYear, poolExecute } from "../util.js";

export async function getCalendar(start: Date, end: Date): Promise<ScheduleInfo> {
	const startDay = dayOfYear(start) - 1;
	const endDay = dayOfYear(end) - 1;
	const numDays = endDay - startDay + 1;

	const districts = (await poolExecute<{ id: number }>("SELECT id FROM districts")).map((d) => d.id);
	const vendors = (await poolExecute<{ id: number }>("SELECT id FROM vendors")).map((v) => v.id);

	const calendarEntries = await poolExecute<{ district: number; vendorId: number; dayOfYear: number }>(
		`
		SELECT vendor_id as vendorId, day_of_year as dayOfYear, district
		FROM calendar
		WHERE (day_of_year BETWEEN ? AND ?) AND year=?`,
		[startDay, endDay, start.getFullYear()]
	);

	const districtMap = new Map<number, DistrictWeek>();
	const vacations: number[][] = Array(numDays)
		.fill(null)
		.map(() => []);
	const free: Set<number>[] = Array(numDays)
		.fill(null)
		.map(() => new Set(vendors));

	for (const district of districts) {
		districtMap.set(district, {
			district: {
				id: district,
			},
			vendorIds: Array(numDays).fill(-1),
		});
	}

	for (const { district, dayOfYear, vendorId } of calendarEntries) {
		if (district === null) {
			vacations[dayOfYear].push(vendorId);
		} else {
			districtMap.get(district)!.vendorIds[dayOfYear] = vendorId;
		}

		free[dayOfYear].delete(vendorId);
	}

	return {
		districts: [...districtMap.values()],
		vacation: vacations,
		free: free.map((set) => [...set.values()]),
	};
}

export async function updateSchedule(date: Date, schedule: ScheduleInfo): Promise<RouteReport> {
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
