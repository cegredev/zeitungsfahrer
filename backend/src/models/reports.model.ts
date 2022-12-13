import Big from "big.js";
import { DefiniteRecord } from "./records.model";
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
	header?: string;
	width?: number;
	style?: any;
	styler?: (value: any) => string;
}

export interface ReportItemDoc {
	name?: string;
	rows: any[][];
	summary: (Big | number)[];
}

export interface Page {
	items: ReportItemDoc[];
	number: number;
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
	body?: Page[];
	totalPages: number;
	summary: string[];
}

export interface ArticleListingReport {
	owner: string;
	items: ReportItem[];
	totalSellNetto: Big;
	totalSellBrutto: Big;
}

export interface ReportItem {
	mwst: number;
	name: string;
	rows: DefiniteRecord[];
}
