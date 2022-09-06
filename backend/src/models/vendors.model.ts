export interface Vendor {
	id?: number;
	name: string;
	address: string;
	zipCode: number;
	city: string;
	supplies: VendorSupply[];
}

export interface VendorSupply {
	weekday?: number;
	supply: number;
}
