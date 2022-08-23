import express, { Request, Response, NextFunction } from "express";
import routes from "./routes.js";
import helmet from "helmet";
import connection from "./database.js";
import cors from "cors";

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: ["http://localhost:3000"] }));
// app.use(express.urlencoded({ extended: true }));

routes(app);

app.listen(3001, () => {
	console.log("Application listening at http://localhost:3001");
});

process.on("exit", connection.end);
