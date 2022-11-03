import { Request, Response } from "express";
import {
	DistrictCalendarEntry,
	ChangedCalendarEntry,
	Driver,
	FullCalendarEntry,
	ScheduleEdit,
	ScheduleView,
} from "../models/schedule.model.js";
import {
	addDriver,
	deleteCalendarEntry,
	deleteDriver,
	getCalendar,
	getSchedule,
	getDrivers,
	updateCalendarEntry,
	updateDriver,
	updateCalendar,
	getDistrictCalendar,
	addDistrict,
	updateDistrictCalendar,
	deleteDistrict,
	updateDistrict,
} from "../services/schedule.service.js";
import { handler } from "./controllers.js";

export async function getCalendarViewController(
	req: Request<any, any, any, { start: Date; end: Date }>,
	res: Response<ScheduleView>
) {
	await handler(
		async () => ({ code: 200, body: await getSchedule(new Date(req.query.start), new Date(req.query.end)) }),
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
			body: await getCalendar(new Date(req.query.start), new Date(req.query.end)),
		}),
		res
	);
}

export async function updateCalendarController(
	req: Request<any, any, ChangedCalendarEntry[]>,
	res: Response<ScheduleView>
) {
	await handler(async () => await updateCalendar(req.body), res);
}

export async function updateCalendarEntryController(
	req: Request<any, any, FullCalendarEntry>,
	res: Response<ScheduleView>
) {
	await handler(async () => await updateCalendarEntry(req.body), res);
}

export async function deleteCalendarEntryController(req: Request<any, any, FullCalendarEntry>, res: Response) {
	await handler(async () => await deleteCalendarEntry(req.body), res);
}

export async function getDistrictsCalendarController(
	req: Request<any, any, any, { start: Date; end: Date }>,
	res: Response
) {
	await handler(
		async () => ({
			code: 200,
			body: await getDistrictCalendar(new Date(req.query.start), new Date(req.query.end)),
		}),
		res
	);
}

export async function addDistrictController(req: Request<any, any, { customId: string }>, res: Response) {
	await handler(async () => ({ code: 200, body: await addDistrict(parseInt(req.body.customId)) }), res);
}

export async function updateDistrictCalendarController(
	req: Request<any, any, DistrictCalendarEntry[]>,
	res: Response<ScheduleView>
) {
	await handler(
		async () => ({
			code: 200,
			body: await updateDistrictCalendar(req.body.map((entry) => ({ ...entry, date: new Date(entry.date) }))),
		}),
		res
	);
}

export async function updateDistrictController(req: Request<{ id: string }, any, { customId: string }>, res: Response) {
	await handler(async () => updateDistrict(parseInt(req.params.id), parseInt(req.body.customId)), res);
}

export async function deleteDistrictController(req: Request<any, any, any, { id: string }>, res: Response) {
	await handler(async () => deleteDistrict(parseInt(req.query.id)), res);
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

export async function deleteDriverController(req: Request<{ id: string }>, res: Response<ScheduleView>) {
	await handler(async () => await deleteDriver(parseInt(req.params.id)), res);
}
