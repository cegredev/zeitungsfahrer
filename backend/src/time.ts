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
