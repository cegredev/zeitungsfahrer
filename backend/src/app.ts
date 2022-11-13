import express from "express";
import routes from "./routes.js";
import helmet from "helmet";
import cors from "cors";
import pool from "./database.js";
import settings from "./services/settings.service.js"; // Initialize variables
import logger from "./logger.js";
import { validateTokenHandler } from "./controllers/controllers.js";
import test from "./lazy_test.js";
test();

const app = express();
app.use(helmet());
app.use(express.json());
app.use(
	cors({
		origin: ["http://localhost:3000", "https://zeitungsfahrer-test.cedricgreiten.com"],
		exposedHeaders: ["Content-Disposition"],
	})
);
app.use((req, _res, next) => {
	logger.info(req.method + " " + req.originalUrl + " " + JSON.stringify(req.body));
	next();
});

app.use("/auth/*", validateTokenHandler);

const PORT = process.env.PORT || 3001;

routes(app);

const server = app.listen(PORT, () => {
	logger.info(`Application listening at port ${PORT}`);
});

process.on("exit", () => {
	logger.info("Shutting down!");

	pool.end();
	server.close();
});
