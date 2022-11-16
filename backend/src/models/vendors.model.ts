export interface SimpleVendor {
	id: number;
	name: string;
	active: boolean;
	customId: number;
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
	phone: string;
	taxId: string;
	active: boolean;
	customId: number;
	lastRecordEntry: Date;
	catalog?: VendorCatalog;
}

export interface DashboardVendor {
	id: number;
	name: string;
	checked: boolean;
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
