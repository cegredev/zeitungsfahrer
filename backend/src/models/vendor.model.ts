import { Price } from "./article.model.js";
import { Vendor } from "./vendors.model.js";

export interface SellingDay {
	articleId?: number;
	date: Date;
	remissions: number;
	sales: number;
	price: Price;
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
