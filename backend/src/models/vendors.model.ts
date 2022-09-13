import { VendorCatalog } from "./vendorCatalog.model";

export interface Vendor {
	id?: number;
	firstName: string;
	lastName: string;
	address: string;
	zipCode: string;
	city: string;
	email: string;
	phone: string;
	taxId: string;
	active: boolean;
	lastRecordEntry: Date;
	catalog?: VendorCatalog;
}
