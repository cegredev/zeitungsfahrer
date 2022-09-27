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
	return new Date(dayjs(date).format("YYYY-MM-DD"));
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
		.map((r) => (!r.missing ? r.price.sell * (r.supply - r.remissions) * ((100 + r.price.mwst) / 100) : 0))
		.reduce((a, b) => a + b, 0);
}
