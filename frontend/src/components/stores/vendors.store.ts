import { atom } from "jotai";
import { Vendor } from "backend/src/models/vendors.model";
import { VendorRecords } from "backend/src/models/records.model";

export const vendorsListAtom = atom<Vendor[]>([]);

export const vendorRecordsAtom = atom<VendorRecords | undefined>(undefined);

export const setVendorsAtom = atom(undefined, (_get, set, vendors: Vendor[]) => {
	set(vendorsListAtom, vendors);
});

export const removeVendorAtom = atom(undefined, (get, set, id: number) => {
	set(
		vendorsListAtom,
		get(vendorsListAtom).filter((vendor) => vendor.id !== id)
	);
});

export const addVendorAtom = atom(undefined, (get, set, vendor: Vendor) => {
	set(vendorsListAtom, [...get(vendorsListAtom), vendor]);
});

export const updateVendorAtom = atom(undefined, (get, set, updated: Vendor) => {
	const vendors = [...get(vendorsListAtom)];
	const vendorId = vendors.findIndex((vendor) => vendor.id === updated.id);

	vendors[vendorId] = { ...vendors[vendorId], ...updated };

	set(vendorsListAtom, vendors);
});
