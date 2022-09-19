export function getConvertedWeekday(date: Date): number {
	return (6 + date.getDay()) % 7;
}

export function getEnvToken(): string {
	const token = process.env.TOKEN_SECRET;
	if (token === undefined) throw new Error("Missing token (private key)!");
	return token;
}
