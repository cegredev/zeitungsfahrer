import { NextFunction, Request, Response } from "express";

function getBookHandler(req: Request, rep: Response, next: NextFunction) {
	console.log("Book handler!");

	rep.status(200).send("Okay!");
}
