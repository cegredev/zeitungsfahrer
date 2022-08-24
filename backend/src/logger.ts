import winston from "winston";

const logger = winston.createLogger({
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({
			// dirname: "logs",
			filename: `logs/log${new Date().getTime()}.log`,
		}),
	],
});

export default logger;
