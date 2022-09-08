export interface VendorCatalog {
	entries: {
		articleName: string;
		articleId: number;
		included: boolean;
		supplies: number[];
	}[];
}
