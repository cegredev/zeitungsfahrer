import mysql from "mysql2/promise";
import env from "./env.js";

const pool = mysql.createPool({
	user: env.DB_USER || process.env.DB_USER,
	database: env.DATABASE || process.env.DATABASE,
	password: env.DB_PASSWORD || process.env.DB_PASSWORD,
	port: parseInt(env.DB_PORT || process.env.DB_PORT),
	host: env.DB_HOSTNAME || process.env.DB_HOSTNAME,
	timezone: "+00:00",
});

console.log(process.env);
console.log(env);

// Was needed on one of my testing machines idk
// pool.execute("SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));");

export interface RouteReport {
	code: number;
	body?: any;
}

export default pool;
