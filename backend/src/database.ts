import mysql from "mysql2";

export const connection = mysql.createConnection({
	host: "localhost",
	user: "dev",
	database: "zeitungsfahrer",
	password: "w0rk!",
	multipleStatements: true,
});

connection.connect((err) => {
	if (err) throw err;

	console.log("MySql connection successful");
});
