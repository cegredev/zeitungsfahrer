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
