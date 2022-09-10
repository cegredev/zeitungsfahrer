import { VendorCatalog } from "./vendorCatalog.model";

export interface Vendor {
	id?: number;
	firstName: string;
	lastName: string;
	address: string;
	zipCode: number;
	city: string;
	email: string;
	phone: string;
	taxId: number;
	catalog?: VendorCatalog;
}
