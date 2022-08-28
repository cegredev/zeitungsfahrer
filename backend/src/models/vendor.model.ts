import { Vendor } from "./vendors.model.js";

export interface ArticleSales {
	remissions: number;
	sales: number;
}

export interface VendorWeek extends Vendor {
	/**
	 * Maps article ID to sales.
	 */
	sales: Map<number, ArticleSales[]>;
}
