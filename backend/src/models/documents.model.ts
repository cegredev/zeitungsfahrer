export type DocType = "invoice" | "report";

export interface Doc {
	id: number;
	type: DocType;
	format: string;
	data: Buffer;
}

export interface DocMeta {
	id: number;
	vendorId: number;
	date: Date;
	type: DocType;
	format: string;
	description: string;
}
