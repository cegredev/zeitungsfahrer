import { VendorRecords } from "backend/src/models/records.model";
import { atom } from "jotai";

export const vendorRecordsAtom = atom<VendorRecords | undefined>(undefined);
