export interface Article {
	id?: number;
	name: string;
	prices: Price[];
}

export interface Price {
	purchase: number;
	sell: number;
	mwst: number;
}

export function validatePrice({ purchase, sell, mwst }: Price): boolean {
	return Math.min(purchase, sell, mwst) >= 0;
}

export function validatePrices(prices: Price[]): boolean {
	return prices.length === 7 && prices.every(validatePrice);
}
