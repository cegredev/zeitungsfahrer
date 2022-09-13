import { Price } from "./articles.model.js";

export interface Record {
	articleId?: number;
	date: Date;
	supply: number;
	remissions: number;
	price: Price;
}

export interface ArticleRecords {
	id: number;
	name: string;
	start: Date;
	totalValueNetto: number;
	totalValueBrutto: number;
	/**
	 * Maps article ID to sales.
	 */
	records: Record[];
}

export interface VendorRecords {
	id: number;
	name: string;
	articleRecords: ArticleRecords[];
}
