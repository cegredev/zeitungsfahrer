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
	summary: (Big | number | string)[];
}

export interface Page {
	items: ReportItemDoc[];
	number: number;
	rowCount: number;
	isLast?: boolean;
}

export interface Report {
	invoiceSystem: number;
	date: Date;
	itemSpecifier?: string;
	columns: Column[];
	summaryRowColumns?: Column[];
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
	summaryRowColumns?: Column[];
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

export interface VendorSalesReport extends ArticleListingReport {
	nettoByMwst: Map<number, Big>;
}

export interface ReportItem {
	name: string;
	rows: DefiniteRecord[];
}

export interface GenericItem<D> {
	identifier: number;
	records: D[];
}

/**
 * D: Data type
 */
export interface GenericReport<D, S = D> {
	identifier: number;
	items: GenericItem<D>[];
	summary: S;
}

export interface NewVendorSalesReport
	extends GenericReport<DefiniteRecord, { totalSellNetto: Big; totalSellBrutto: Big }> {
	nettoByMwst: Map<number, Big>;
}
