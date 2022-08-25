import express from "express";
// import routes from "./routes.js";
// import helmet from "helmet";
// // import connection from "./database.js";
// import cors from "cors";
// import logger from "./logger.js";

const app = express();
// app.use(helmet());
// app.use(express.json());
// app.use(cors({ origin: ["http://localhost:3000", "https://zeitungsfahrer-test.cedricgreiten.com"] }));
// app.use((req, res, next) => {
// 	logger.info(req.method + " " + req.originalUrl + " " + JSON.stringify(req.body));
// 	next();
// });

const PORT = process.env.port || 3001;

console.log("port", PORT);

// routes(app);

const server = app.listen(PORT, () => {
	// logger.info(`Application listening at port ${PORT}`);
});

// process.on("exit", () => {
// 	logger.info("Shutting down!");

// 	// connection.end();
// 	server.close();
// });
