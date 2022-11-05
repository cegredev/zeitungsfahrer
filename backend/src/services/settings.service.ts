import pool, { RouteReport } from "../database.js";
import { Settings } from "../models/settings.model.js";
import { poolExecute } from "../util.js";
import { login } from "./accounts.service.js";

const initialSettings = (await poolExecute("SELECT * FROM settings LIMIT 1"))[0];

const settings: Settings = {
	id: initialSettings.id,
	invoiceSystem: initialSettings.invoice_system,
};

export async function loginSettings(password: string): Promise<RouteReport> {
	return (await login("settings", password)) ? { code: 200 } : { code: 403 };
}

export async function updateSettings(newSettings: Settings): Promise<void> {
	await pool.execute("UPDATE settings SET invoice_system=? WHERE id=?", [newSettings.invoiceSystem, settings.id]);

	settings.invoiceSystem = newSettings.invoiceSystem;
}

export async function updateSettingsRoute(newSettings: Settings): Promise<RouteReport> {
	await updateSettings(newSettings);

	return {
		code: 200,
	};
}

export async function getSettings(): Promise<RouteReport> {
	return {
		code: 200,
		body: settings,
	};
}

export default settings;
