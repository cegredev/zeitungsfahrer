import mysql from "mysql2/promise";
import config from "./config.js";

const pool = mysql.createPool({
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

export default pool;
