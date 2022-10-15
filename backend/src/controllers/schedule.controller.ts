import { Request, Response } from "express";
import { ScheduleView } from "../models/schedule.model.js";
import { getCalendarEdit, getCalendarView, updateSchedule } from "../services/schedule.service.js";
import { handler } from "./controllers.js";

export async function getCalendarViewController(
	req: Request<any, any, any, { start: Date; end: Date }>,
	res: Response<ScheduleView>
) {
	await handler(
		async () => ({ code: 200, body: await getCalendarView(new Date(req.query.start), new Date(req.query.end)) }),
		res
	);
}

export async function getCalendarEditController(
	req: Request<any, any, any, { start: Date; end: Date }>,
	res: Response<ScheduleView>
) {
	await handler(
		async () => ({
			code: 200,
			body: await getCalendarEdit(new Date(req.query.start), new Date(req.query.end)),
		}),
		res
	);
}

export async function updateCalendarController(
	req: Request<any, any, ScheduleView, { date: string }>,
	res: Response<ScheduleView>
) {
	await handler(async () => updateSchedule(new Date(req.query.date), req.body), res);
}
