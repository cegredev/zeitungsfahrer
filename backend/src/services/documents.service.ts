import dayjs from "dayjs";
import pool from "../database.js";
import { Doc, DocMeta, DocType } from "../models/documents.model.js";
import { poolExecute } from "../util.js";
import { getDateRange } from "./records.service.js";

export async function getDocument(id: number, type: DocType): Promise<Doc> {
	const response = await poolExecute<{ data: Buffer; format: string }>(
		"SELECT data, format FROM documents WHERE id=? AND doc_type=?",
		[id, type]
	);

	const element = response[0];

	return { id, type, format: element.format, data: element.data };
}

export async function getDocumentMeta(id: number, type: DocType): Promise<DocMeta> {
	const response = await poolExecute<DocMeta>(
		"SELECT id, date, vendor_id as vendorId, format, description FROM documents WHERE doc_type=? AND id=?",
		[type, id]
	);
	return response[0];
}

export async function getDocuments(vendorId: number, date: Date, system: number): Promise<DocMeta[]> {
	const dateRange = getDateRange(date, system);

	const data = await poolExecute<DocMeta>(
		"SELECT id, date, doc_type as type, format, description FROM documents WHERE vendor_id=? AND date BETWEEN ? AND ? ORDER BY date DESC, id DESC",
		[vendorId, ...dateRange]
	);

	return data;
}

export async function createDocument(
	type: DocType,
	vendorId: number,
	date: Date,
	format: string,
	description?: string,
	data?: any
): Promise<number> {
	const result = await pool.execute(
		"INSERT INTO documents (doc_type, vendor_id, date, format, description, data) VALUES (?, ?, ?, ?, ?, ?)",
		[type, vendorId, dayjs(date).format("YYYY-MM-DD"), format, description || null, data || null]
	);

	// @ts-ignore
	const id: number = result[0].insertId;

	return id;
}

export async function storeDocument(id: number, data: Buffer, type: DocType): Promise<void> {
	await poolExecute("UPDATE documents SET data=? WHERE id=? AND doc_type=?", [data, id, type]);
}

export async function deleteDocument(id: number, type: DocType): Promise<void> {
	await poolExecute("DELETE FROM documents WHERE id=? AND doc_type=?", [id, type]);
}
