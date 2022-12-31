import { Record } from "backend/src/models/records.model";
import dayjs from "dayjs";
import { downloadUrl } from "./files";
import Big from "big.js";
import { Role } from "backend/src/models/accounts.model";

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

export const weekdaysShort = ["Mon", "Die", "Mitt", "Don", "Frei", "Sam", "Son"];

export const twoDecimalsFormat = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 2,
});

export function normalizeDate(date: Date): Date {
	let draft = dayjs()
		.year(date.getFullYear())
		.month(date.getMonth())
		.date(date.getDate())
		.hour(0)
		.minute(0)
		.second(0)
		.millisecond(0);

	return draft.toDate();
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

export function calculateTotalValueBrutto(records: Record[]): Big {
	return records
		.map((r) =>
			!r.missing ? r.price!.sell.mul((r.supply - r.remissions) * ((100 + r.price!.mwst) / 100)) : Big(0)
		)
		.reduce((a, b) => a.add(b), Big(0));
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

export function openFile(name: string, url: string) {
	const w = window.open(url, "_blank");
	if (w) {
		w.document.write(
			"<html><head><title>" +
				name +
				"</title></head><body>" +
				'<embed width="100%" height="100%" name="plugin" src="' +
				url +
				'" ' +
				'type="application/pdf" internalinstanceid="21"></body></html>'
		);
		w.focus();
	}
}

export function openAndDownloadFile(name: string, extension: string, url: string) {
	openFile(name, url);

	setTimeout(() => downloadUrl(url, name + extension), 1000);
}

export function chooseBasedOnRole<T>(
	role: Role | undefined,
	main: T,
	dataEntry: T,
	plan: T,
	accountAdmin: T,
	vendor: T
): T {
	switch (role) {
		case undefined:
		case "main":
			return main;
		case "dataEntry":
			return dataEntry;
		case "plan":
			return plan;
		case "accountAdmin":
			return accountAdmin;
		case "vendor":
			return vendor;
	}
}

export function generatePassword(length: number): string {
	function generateRandomByte() {
		const result = new Uint8Array(1);
		window.crypto.getRandomValues(result);
		return result[0];
	}

	const pattern = /[a-zA-Z0-9_\-\+\.]/;

	return Array(length)
		.fill(null)
		.map(() => {
			while (true) {
				const result = String.fromCharCode(generateRandomByte());
				if (pattern.test(result)) {
					return result;
				}
			}
		})
		.join("");
}
