import { VendorWeek } from "backend/src/models/vendor.model";
import { atom } from "jotai";

export const vendorWeekAtom = atom<VendorWeek | undefined>(undefined);

export const setVendorWeekAtom = atom(undefined, (_get, set, vendorWeek: VendorWeek) => {
	set(vendorWeekAtom, vendorWeek);
});
