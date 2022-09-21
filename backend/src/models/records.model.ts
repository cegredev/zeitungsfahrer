import { Price } from "./articles.model.js";

export interface Record {
	articleId?: number;
	date: Date;
	supply: number;
	remissions: number;
	price: Price;
	missing: boolean;
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

export interface DashboardRecords {
	articles: { id: number; name: string; supply?: Number; included: boolean }[];
	totalValueBrutto: number;
}

export interface Sales {
	supply: number;
	remissions: number;
}

export interface ArticleSales {
	sales: Sales[];
}

export interface VendorSales {
	sales: number[];
}
