import Big from "big.js";
import { SimpleVendor } from "./vendors.model";

export interface Invoice {
	date: Date;
	counter: number;
	vendor: SimpleVendor;
	sales: {
		supply: number;
		remissions: number;
		valueNetto: Big;
		valueBrutto: Big;
	}[];
}
