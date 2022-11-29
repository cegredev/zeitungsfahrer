import { ArticleInfo, Price } from "./articles.model.js";

export interface DefiniteRecord {
	articleId?: number;
	date: Date;
	supply: number;
	remissions: number;
	sales: number;
	price: Price;
}

export interface Record {
	articleId?: number;
	date: Date;
	supply: number;
	remissions: number;
	price?: Price;
	missing?: boolean;
}

export interface ChangedRecord {
	date: Date;
	articleId: number;
	supply: number;
	remissions: number;
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

export interface DashboardRecord extends ArticleInfo {
	supply: number;
}

export interface DashboardRecords {
	articles: DashboardRecord[];
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
