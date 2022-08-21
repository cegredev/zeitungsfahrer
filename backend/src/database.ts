import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
	host: "localhost",
	user: "dev",
	database: "zeitungsfahrer",
	password: "w0rk!",
	multipleStatements: true,
});

await connection.connect();

console.log("MySql connection successful");

export default connection;
