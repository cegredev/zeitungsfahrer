export interface Article {
	id?: number;
	name: string;
	prices: Price[];
}

export interface Price {
	startDate: Date;
	weekday: number;
	articleId?: number;
	purchase: number;
	sell: number;
	marketSell: number;
	mwst: number;
	endDate?: Date;
}

export function validatePrice({ purchase, sell, marketSell: sellTrader, mwst }: Price): boolean {
	return Math.min(purchase, sell, sellTrader, mwst) >= 0;
}

export function validatePrices(prices: Price[]): boolean {
	return prices.length === 7 && prices.every(validatePrice);
}
