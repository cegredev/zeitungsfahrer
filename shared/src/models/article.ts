export interface ArticleInfo {
	data: Article;
	prices: Price[];
}

export interface Article {
	id?: number;
	name: string;
	mwst: number;
}

export interface Price {
	purchase: number;
	sell: number;
}
