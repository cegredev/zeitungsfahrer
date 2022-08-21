export interface Article {
	id: number;
	name: string;
	mwst: number;
	prices: Price[];
}

export interface Price {
	purchase: number;
	sell: number;
}
