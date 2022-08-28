import { Article } from "./article.model.js";
import { Vendor } from "./vendors.model.js";

export interface Sales {
	remissions: number;
	sales: number;
}

export interface ArticleWeek {
	id: number;
	name: string;
	/**
	 * Maps article ID to sales.
	 */
	sales: Sales[];
}

export interface VendorWeek extends Vendor {
	articles: ArticleWeek[];
}
