import { Request, Response } from "express";
import { ScheduleInfo } from "../models/schedule.model.js";
import { getCalendar } from "../services/schedule.service.js";
import { handler } from "./controllers.js";

export async function getCalendarController(
	req: Request<any, any, any, { start: Date; end: Date }>,
	res: Response<ScheduleInfo>
) {
	await handler(
		async () => ({ code: 200, body: await getCalendar(new Date(req.query.start), new Date(req.query.end)) }),
		res
	);
}
