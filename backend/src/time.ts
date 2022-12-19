import dayjs from "dayjs";

export function normalizeDate(date: Date): Date {
	let draft = dayjs()
		.year(date.getFullYear())
		.month(date.getMonth())
		.date(date.getDate())
		.hour(1)
		.minute(0)
		.second(0)
		.millisecond(0);

	return draft.toDate();
}

export function daysBetween(a: Date, b: Date): number {
	const millisInDay = 1000 * 60 * 60 * 24;

	return Math.abs(Math.round((b.getTime() - a.getTime()) / millisInDay));
}

function firstWeekStart(year: number): Date {
	let firstWeek = dayjs().set("year", year).set("month", 0).set("date", 1).set("day", 4).toDate();

	if (firstWeek.getFullYear() !== year) {
		firstWeek = dayjs(firstWeek).add(1, "week").toDate();
	}

	return dayjs(normalizeDate(firstWeek)).toDate();
}

export function getKW(date: Date): number {
	const firstWeek = firstWeekStart(date.getFullYear());

	// If it's Sunday, subtract one week
	if (date.getDay() === 0) date = dayjs(date).subtract(1, "week").toDate();

	date = dayjs(normalizeDate(date)).set("day", 4).toDate();

	if (firstWeek.getTime() > date.getTime()) {
		return getKW(dayjs(firstWeek).subtract(1, "week").toDate());
	}

	return Math.ceil(dayjs(date).diff(firstWeek, "weeks")) + 1;
}
