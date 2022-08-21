import express, { Request, Response, NextFunction } from "express";
import routes from "./routes.js";
import helmet from "helmet";
import connection from "./database.js";

const app = express();
app.use(helmet());
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

routes(app);

app.listen(3000, () => {
	console.log("Application listening at http://localhost:3000");
});

process.on("exit", connection.end);
