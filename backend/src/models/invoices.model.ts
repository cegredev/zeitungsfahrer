import Big from "big.js";
import { Page, ReportItemDoc } from "./reports.model";
import { Vendor } from "./vendors.model";

export interface InvoiceMeta {
	id: number;
	vendorId: number;
}

export interface InvoiceLink {
	id: number;
	date: Date;
	description: string;
}

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
