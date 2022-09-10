export interface VendorCatalogEntry {
	articleName: string;
	articleId: number;
	included: boolean;
	supplies: number[];
}

export interface VendorCatalog {
	vendorId?: number;
	entries: VendorCatalogEntry[];
}
