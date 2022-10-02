import { ArticleRecords, VendorRecords } from "backend/src/models/records.model";
import { atom } from "jotai";

export const vendorRecordsAtom = atom<VendorRecords | undefined>(undefined);

export const updateArticleRecordsAtom = atom(undefined, (get, set, records: ArticleRecords) => {
	const vendorRecords = get(vendorRecordsAtom)!;
	const oldRecords = vendorRecords!.articleRecords;
	const index = oldRecords.findIndex((r) => r.id === records.id);

	oldRecords[index].records = records.records;

	set(vendorRecordsAtom, { ...vendorRecords, articleRecords: [...oldRecords] });
});
