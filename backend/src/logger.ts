import winston from "winston";

function formatDate(date: Date): string {
	const a = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
	const b = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()];

	const join = (delimiter: string, arr: any[]) => {
		return arr.map((val) => val.toString().padStart(2, "0")).join(delimiter);
	};

	return join("-", a) + " " + join("_", b);
}

const logger = winston.createLogger({
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({
			// dirname: "logs",
			filename: `logs/log${formatDate(new Date())}.log`,
		}),
	],
});

export default logger;
