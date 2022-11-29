import Big from "big.js";
import { SimpleVendor } from "./vendors.model";

export type ReportType = "pdf" | "excel";

export interface ReportedVendor {
	name: string;
	amountNetto: Big;
	amountBrutto: Big;
}

export interface WeeklyBillReport {
	vendors: ReportedVendor[];
	totalNetto: Big;
	totalBrutto: Big;
}

export interface ReportedArticle {
	supply: number;
	remissions: number;
	amountNetto: Big;
	amountBrutto: Big;
}

export interface Column {
	header: string;
	width: number;
	style?: any;
	styler?: (value: any) => string;
}

export interface ReportItemDoc {
	name?: string;
	rows: any[][];
	summary: (Big | number)[];
}

export interface Report {
	invoiceSystem: number;
	date: Date;
	itemSpecifier?: string;
	columns: Column[];
	summaryColumns?: Column[];
	body: ReportItemDoc[];
	summary: any[];
}

export interface ReportDoc {
	header: {
		top: string;
		sub: string;
		itemSpecifier: string;
	};
	columns: Column[];
	summaryColumns?: Column[];
	body?: ReportItemDoc[];
	tablesPerPage: number;
	summary: string[];
}
