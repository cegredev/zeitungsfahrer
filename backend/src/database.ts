import mysql from "mysql2/promise";
import fs from "fs/promises";

const connectionData = await fs.readFile("env.json", "utf8");

const connection = await mysql.createConnection({
	...JSON.parse(connectionData),
	multipleStatements: true,
});

await connection.connect();

console.log("MySql connection successful");

export default connection;
