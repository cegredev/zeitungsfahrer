export interface SimpleVendor {
	id: number;
	name: string;
	active: boolean;
	// represents: number | null;
}

export interface Vendor {
	id?: number;
	firstName: string;
	lastName: string;
	address: string;
	zipCode: number;
	city: string;
	email: string;
	phone: number;
	taxId: number;
	active: boolean;
	lastRecordEntry: Date;
	catalog?: VendorCatalog;
}

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

export interface VendorIncludedArticles {
	name: string;
	articleIds: number[];
}
