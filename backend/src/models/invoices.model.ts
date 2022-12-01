import Big from "big.js";
import { ReportItemDoc } from "./reports.model";
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
	articles: ReportItemDoc[];
	summary: any[];
}
