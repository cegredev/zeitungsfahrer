import { Record } from "backend/src/models/records.model";
import dayjs from "dayjs";

export const months = [
	"Januar",
	"Februar",
	"März",
	"April",
	"Mai",
	"Juni",
	"Juli",
	"August",
	"September",
	"Oktober",
	"November",
	"Dezember",
];

export const invoiceSystems = ["Tag", "Woche", "Monat", "Jahr"];

export const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export const weekdaysShort = ["Mon", "Die", "Mitt", "Don", "Fre", "Sam", "Son"];

export const twoDecimalsFormat = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 2,
});

export function normalizeDate(date: Date): Date {
	return dayjs()
		.year(date.getFullYear())
		.month(date.getMonth())
		.date(date.getDate())
		.hour(0)
		.minute(0)
		.second(0)
		.millisecond(0)
		.toDate();
}

export function dayOfYear(date: Date): number {
	return Math.floor(
		(normalizeDate(date).getTime() - new Date(new Date().getFullYear() + "-01-01").getTime()) /
			(1000 * 60 * 60 * 24)
	);
}

export function dateAsTextWithSystem(date: Date, system: number): string {
	switch (system) {
		case 0:
			return dayjs(date).format("DD.MM.YYYY");
		case 1:
			return "" + dayjs(date).week();
		case 2:
			return months[date.getMonth()];
		case 3:
			return dayjs(date).format("YYYY");
		default:
			return dayjs(date).format("YYYY-MM-DD");
	}
}

export function calculateTotalValueBrutto(records: Record[]): number {
	return records
		.map((r) => (!r.missing ? r.price!.sell * (r.supply - r.remissions) * ((100 + r.price!.mwst) / 100) : 0))
		.reduce((a, b) => a + b, 0);
}

export const activities = {
	working: 0,
	planfrei: 1,
	vacation: 2,
	sick: 3,
	plus: 4,
};

export const activityStyles: Map<number, React.CSSProperties & { displayName?: string }> = new Map([
	[activities.working, { backgroundColor: "#756f75", color: "inherit", displayName: "" }],
	[activities.planfrei, { backgroundColor: "#f0d62b", color: "inherit", displayName: "Planfrei" }],
	[activities.vacation, { backgroundColor: "#07a812", color: "inherit", displayName: "Urlaub" }],
	[activities.sick, { backgroundColor: "#bf0404", color: "white", displayName: "Krank" }],
	[activities.plus, { backgroundColor: "#2f36a1", color: "white", displayName: "Plus" }],
]);

export function parseIntOr(input: string, or: number): number {
	return parseInt(input) || or;
}
