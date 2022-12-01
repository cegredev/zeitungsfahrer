import mysql from "mysql2/promise";
import env from "./env.js";

const pool = mysql.createPool({
	user: env.DB_USER,
	database: env.DATABASE,
	password: env.DB_PASSWORD,
	port: parseInt(env.DB_PORT!),
	host: env.DB_HOSTNAME,
	timezone: "+00:00",
});

// Was needed on one of my testing machines idk
pool.execute("SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));");

export interface RouteReport {
	code: number;
	body?: any;
}

export default pool;
