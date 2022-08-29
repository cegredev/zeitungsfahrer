import { Vendor } from "./vendors.model.js";

export interface SellingDay {
	remissions: number;
	sales: number;
	mwst: number;
}

export interface ArticleWeek {
	id: number;
	name: string;
	start: Date;
	/**
	 * Maps article ID to sales.
	 */
	days: SellingDay[];
}

export interface VendorWeek extends Vendor {
	articleWeeks: ArticleWeek[];
}
