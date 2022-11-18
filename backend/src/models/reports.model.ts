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

interface Column {
	header: string;
	width: number;
	style?: any;
	styler?: (value: any) => string;
}

export interface Report {
	invoiceSystem: number;
	date: Date;
	itemSpecifier?: string;
	columns: Column[];
	body?: any[][];
	summary: any[];
}

export interface ReportDoc {
	header: {
		top: string;
		sub: string;
		itemSpecifier: string;
	};
	columns: Column[];
	body?: any[][];
	summary: string[];
}

export interface VendorSalesReport {
	articles: Map<number, string>;
	amountsByArticle: Map<number, ReportedArticle>;
}
