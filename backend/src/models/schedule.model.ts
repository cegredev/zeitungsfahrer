export interface District {
	id: number;
	customId?: number;
}

export interface DistrictDriver {
	id: number;
	oldActivity?: number; // Only set in GUI!
}

export interface DistrictWeek {
	district: District;
	drivers: DistrictDriver[];
}

export interface Driver {
	id: number;
	name: string;
	defaultDistrict: number;
}

export interface EditedDriver extends Driver {
	oldDefault?: number;
}

export type DistrictActivity = number;

export interface DistrictCalendarEntry {
	districtId: number;
	activity: DistrictActivity;
	date: Date;
}

export interface DistrictCalendar {
	districts: District[];
	calendar: DistrictActivity[][];
}

/**
 * 0: Working
 * 1: Planfrei
 * 2: Vacation
 * 3: Sick
 * 4: Plus
 */
export type Activity = number;

export interface ChangedCalendarEntry {
	date: string;
	driverId: number;
	activity: number;
	districtId?: number;
}

export interface FullCalendarEntry {
	date: Date;
	driverId: number;
	activity: number;
	district?: number;
}

export interface ScheduleEntry {
	activity: Activity;
	district?: number;
}

export interface ScheduleEdit {
	calendar: ScheduleEntry[][];
	drivers: Driver[];
	districts: District[];
}

export interface ScheduleView {
	districts: DistrictWeek[];
	vacation: number[][];
	free: number[][];
	sick: number[][];
	plus: number[][];
	drivers: Driver[];
}
