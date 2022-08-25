import mysql from "mysql2/promise";
import config from "./config.js";
import logger from "./logger.js";

const connection = await mysql.createConnection({
	// ...JSON.parse(connectionData),
	user: config.DB_USER,
	database: config.DATABASE,
	password: config.DB_PASSWORD,
	port: parseInt(config.DB_PORT!),
	host: config.DB_HOSTNAME,
	multipleStatements: true,
});

export interface RouteReport {
	code: number;
	body?: string;
}

try {
	await connection.connect();
	logger.info("MySql connection successful");
} catch (e) {
	logger.error("MySql connection failed", e);
}

export default connection;
