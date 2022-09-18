import pool, { RouteReport } from "../database.js";
import { Settings } from "../models/settings.model.js";

// @ts-ignore
const initialSettings: any = (await pool.execute("SELECT * FROM settings LIMIT 1"))[0][0];

const settings: Settings = {
	id: initialSettings.id,
	invoiceSystem: initialSettings.invoice_system,
};

export async function updateInvoiceSystem(invoiceSystem: 0 | 1 | 2 | 3): Promise<void> {
	await pool.execute("UPDATE settings invoice_system=? WHERE id=?", [invoiceSystem, settings.id]);

	settings.invoiceSystem = invoiceSystem;
}

export async function getSettings(): Promise<RouteReport> {
	return {
		code: 200,
		body: settings,
	};
}

export default settings;
