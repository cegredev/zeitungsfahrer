import { AddWorksheetOptions } from "exceljs";
import { Role } from "./models/accounts.model";

export const DATE_FORMAT = "YYYY-MM-DD";
export const MILlIS_IN_DAY = 24 * 60 * 60 * 1_000;

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

export const twoDecimalFormat = new Intl.NumberFormat("de-DE", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 2,
});

export const dinA4ExcelLandscape: Partial<AddWorksheetOptions> = {
	pageSetup: {
		paperSize: 9,
		orientation: "landscape",
		showGridLines: true,
	},
};

export const allRoles: Role[] = ["main", "plan", "accountAdmin"];
