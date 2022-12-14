import Big from "big.js";
import { Page, ReportItemDoc } from "./reports.model";
import { Vendor } from "./vendors.model";

export interface InvoiceLink {
	id: number;
	date: Date;
}

export interface InvoiceNr {
	date: Date;
	counter: number;
	description: string;
}

export interface Invoice {
	vendor: Vendor;
	date: Date;
	nr: InvoiceNr;
	pages: Page[];
	totalPages: number;
	summary: any[];
}

export interface CustomInvoiceText {
	contact: string;
	byeText: string;
	payment: string;
}
