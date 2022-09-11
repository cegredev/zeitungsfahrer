import { VendorRecords } from "backend/src/models/vendor.model";
import { atom } from "jotai";

export const vendorRecordsAtom = atom<VendorRecords | undefined>(undefined);
