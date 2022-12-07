import Big from "big.js";
import { Page, ReportItemDoc } from "./reports.model";
import { Vendor } from "./vendors.model";

export interface InvoiceNr {
	year: number;
	week: number;
	counter: number;
}

export interface Invoice {
	vendor: Vendor;
	date: Date;
	nr: InvoiceNr;
	pages: Page[];
	totalPages: number;
	summary: any[];
}
