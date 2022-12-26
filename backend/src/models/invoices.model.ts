import Big from "big.js";
import { Page } from "./reports.model";
import { Vendor } from "./vendors.model";

export interface InvoiceNr {
	date: Date;
	counter: number;
	description: string;
}

export interface SingleMwstSummary {
	mwst: number;
	nettoTotal: Big;
	mwstCut: Big;
	bruttoTotal: Big;
}

export interface MwstSummary {
	totalBrutto: Big;
	summaries: SingleMwstSummary[];
}

export interface Invoice {
	vendor: Vendor;
	date: Date;
	nr: InvoiceNr;
	mwstSummary: MwstSummary;
	pages: Page[];
	totalPages: number;
	summary: any[];
}

export interface CustomInvoiceText {
	contact: string;
	byeText: string;
	payment: string;
}
