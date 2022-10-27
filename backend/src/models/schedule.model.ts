export interface District {
	id: number;
}

export interface DistrictDriver {
	id: number;
	oldActivity?: number; // Only set in GUI!
}

export interface DistrictWeek {
	district: number;
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

export interface DistrictCalendar {
	districts: number[];
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

export interface FullCalendarEntry {
	year: number;
	date: number;
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
	districts: number[];
}

export interface ScheduleView {
	districts: DistrictWeek[];
	vacation: number[][];
	free: number[][];
	sick: number[][];
	plus: number[][];
	drivers: Driver[];
}
