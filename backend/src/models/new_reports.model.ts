import Big from "big.js";
import { Price } from "../models/articles.model";

export interface ReportData {
	supply: number;
	remissions: number;
	sales: number;
}

export interface ReportRecord extends ReportData {
	date: Date;
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

export interface ArticleReport {
	articleId: number;
	vendorId?: number;
	records: ReportRecord[];
	summary: ReportSummary;
}

export interface TotalReport {
	articles: ArticleReport[];
	summary: ReportSummary;
}

export interface VendorReport extends TotalReport {
	vendorId: number;
	summary: ReportSummary;
}

export interface AllVendorsReport {
	vendors: VendorReport[];
	summary: ReportSummary;
}
