import dayjs from "dayjs";
import pool from "./database.js";

const proto = dayjs.prototype;
proto.dayOfYear = function (input: Date) {
	// @ts-ignore
	const dayOfYear = Math.round((dayjs(this).startOf("day") - dayjs(this).startOf("year")) / 864e5) + 1;
	// @ts-ignore
	return input == null ? dayOfYear : this.add(input - dayOfYear, "day");
};

export function dayOfYear(date: Date): number {
	// @ts-ignore
	return dayjs(date).dayOfYear();
}

export async function poolExecute<T = any>(query: string, values?: any[], mapper?: (e: any) => T): Promise<T[]> {
	// @ts-ignore
	return (await pool.execute(query, values))[0];
}

export function getConvertedWeekday(date: Date): number {
	return (6 + date.getDay()) % 7;
}

export function getEnvToken(): string {
	const token = process.env.TOKEN_SECRET;
	if (token === undefined) throw new Error("Missing token (private key)!");
	return token;
}
