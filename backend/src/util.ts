import Big from "big.js";
import dayjs from "dayjs";
import crypto from "crypto";
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

export function mulWithMwst(value: Big, mwst: number): Big {
	return value.mul(1 + mwst / 100.0);
}

export function generatePassword(length: number): string {
	function generateRandomByte() {
		return crypto.randomBytes(1).at(0)!;
	}

	const pattern = /[a-zA-Z0-9_\-\+\.]/;

	return Array(length)
		.fill(null)
		.map(() => {
			while (true) {
				const result = String.fromCharCode(generateRandomByte());
				if (pattern.test(result)) {
					return result;
				}
			}
		})
		.join("");
}
