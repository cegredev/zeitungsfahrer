import Big from "big.js";
import dayjs from "dayjs";
import { Price } from "../models/articles.model";
import { ReportType } from "./reports.model";

export type Cell = string | number | Date;
export type RowGenerator<T> = (value: T) => Cell[];
export type SummaryGenerator = (summary: ReportSummary) => Cell[];

export interface Style {
	pdfStyle: (cell: Cell) => string;
	excelStyle: { numFmt: string };
}

export interface ReportData {
	supply: number;
	remissions: number;
	sales: number;
}

export interface DBRecord extends ReportData {
	date: Date;
}

export interface ReportRecord extends DBRecord {
	price: Price;
}

export interface Amount {
	netto: Big;
	brutto: Big;
}

export interface ReportSummary {
	basic?: ReportData;
	purchase?: Amount;
	sell?: Amount;
	marketSell?: Amount;
}

export interface Report {
	reports: Map<number, ArticleReport>;
	summary: ReportSummary;
}

export interface ArticleReport {
	articleId: number;
	records: ReportRecord[];
	summary: ReportSummary;
}

export interface MultiArticleReport {
	articles: ArticleReport[];
	summary: ReportSummary;
}

export interface VendorReport extends MultiArticleReport {
	vendorId: number;
}

export interface AllVendorsReport {
	vendors: VendorReport[];
	summary: ReportSummary;
}

export interface SinglePrintableReport {
	identifier?: string;
	rows: Cell[][];
	summary: Cell[];
}

export interface PrintableReport {
	articles: SinglePrintableReport[];
	summary: SinglePrintableReport;
}

export interface PrintableReportDoc extends PrintableReport {
	head: {
		headline: string;
		time: string;
		entity: string;
	};
}

export interface ReportPrintConfig {
	type: ReportType;
}
