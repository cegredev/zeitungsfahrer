import { Request, Response } from "express";
import { Driver, FullCalendarEntry, ScheduleEdit, ScheduleView } from "../models/schedule.model.js";
import {
	addDriver,
	deleteCalendarEntry,
	deleteDriver,
	getCalendarEdit,
	getCalendarView,
	getDrivers,
	updateCalendarEntry,
	updateDriver,
	updateSchedule,
} from "../services/schedule.service.js";
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
	res: Response<ScheduleEdit>
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
	req: Request<any, any, ScheduleEdit, { date: string }>,
	res: Response<ScheduleView>
) {
	await handler(async () => await updateSchedule(new Date(req.query.date), req.body), res);
}

export async function updateCalendarEntryController(
	req: Request<any, any, FullCalendarEntry>,
	res: Response<ScheduleView>
) {
	console.log("update", req.body);

	await handler(async () => await updateCalendarEntry(req.body), res);
}

export async function deleteCalendarEntryController(req: Request<any, any, FullCalendarEntry>, res: Response) {
	await handler(async () => await deleteCalendarEntry(req.body), res);
}

export async function getDriversController(req: Request, res: Response) {
	await handler(
		async () => ({
			code: 200,
			body: await getDrivers(),
		}),
		res
	);
}

export async function addDriverController(
	req: Request<any, any, { name: string; defaultDistrict: string }>,
	res: Response<ScheduleView>
) {
	await handler(async () => await addDriver(req.body.name, parseInt(req.body.defaultDistrict)), res);
}

export async function updateDriverController(req: Request<any, any, Driver>, res: Response<ScheduleView>) {
	await handler(async () => await updateDriver(req.body), res);
}

export async function deleteDriverController(req: Request<any, any, { id: string }>, res: Response<ScheduleView>) {
	await handler(async () => await deleteDriver(parseInt(req.body.id)), res);
}
