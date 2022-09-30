import dayjs from "dayjs";
import pool, { RouteReport } from "../database.js";
import { DistrictWeek, ScheduleInfo } from "../models/schedule.model.js";
import { dayOfYear } from "../util.js";

export async function getCalendar(start: Date, end: Date): Promise<ScheduleInfo> {
	const startDay = dayOfYear(start);
	const endDay = dayOfYear(end);

	const districtsRes = await pool.execute("SELECT id FROM districts");

	// @ts-ignore
	const districts: number[] = districtsRes[0].map((d) => d.id);

	const calendar = await pool.execute(
		`
		SELECT vendor_id as vendorId, day_of_year as dayOfYear, district
		FROM calendar
		WHERE (day_of_year BETWEEN ? AND ?) AND year=?`,
		[startDay, endDay, start.getFullYear()]
	);

	// @ts-ignore
	const rows: { district: number; vendorId: number; dayOfYear: number }[] = calendar[0];
	const districtMap = new Map<number, DistrictWeek>();
	const vacations: number[][] = Array(365)
		.fill(null)
		.map(() => []);
	// const free =

	for (const district of districts) {
		districtMap.set(district, {
			district: {
				id: district,
			},
			vendorIds: Array(365).fill(-1),
		});
	}

	console.log(rows);

	for (const row of rows) {
		if (row.district === null) {
			vacations[row.dayOfYear].push(row.vendorId);
		} else {
			const district = districtMap.get(row.district)!;
			district.vendorIds[row.dayOfYear] = row.vendorId;
		}
	}

	console.log(vacations);

	return {
		districts: [...districtMap.values()],
		vacation: vacations,
		free: [],
	};
}
