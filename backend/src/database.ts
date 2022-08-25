import mysql from "mysql2/promise";
import env from "./env.js";

const pool = mysql.createPool({
	user: env.DB_USER,
	database: env.DATABASE,
	password: env.DB_PASSWORD,
	port: parseInt(env.DB_PORT!),
	host: env.DB_HOSTNAME,
});

export interface RouteReport {
	code: number;
	body?: string;
}

export default pool;
