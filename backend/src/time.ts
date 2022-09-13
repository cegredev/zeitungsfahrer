import dayjs from "dayjs";

export function normalizeDate(date: Date): Date {
	return new Date(dayjs(date).format("YYYY-MM-DD"));
}

export function daysBetween(a: Date, b: Date): number {
	const millisInDay = 1000 * 60 * 60 * 24;

	return Math.abs(Math.round((b.getTime() - a.getTime()) / millisInDay));
}
