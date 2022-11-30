import Big from "big.js";

export interface ArticleInfo {
	id: number;
	name: string;
}

export interface Article {
	id?: number;
	name: string;
	prices: Price[];
}

export interface Price {
	startDate: Date;
	weekday: number;
	articleId?: number;
	purchase: Big;
	sell: Big;
	marketSell: Big;
	mwst: number;
	endDate?: Date;
}

export function validatePrice({ purchase, sell, marketSell, mwst }: Price): boolean {
	return Math.min(purchase.toNumber(), sell.toNumber(), marketSell.toNumber(), mwst) >= 0;
}

export function validatePrices(prices: Price[]): boolean {
	return prices.length === 7 && prices.every(validatePrice);
}
