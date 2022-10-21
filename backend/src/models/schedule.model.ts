import { SimpleVendor } from "./vendors.model";

export interface District {
	id: number;
}

export interface DistrictWeek {
	district: number;
	drivers: number[];
}

export interface Driver {
	id: number;
	name: string;
	defaultDistrict: number;
}

/**
 * 0: Working
 * 1: Planfrei
 * 2: Vacation
 * 3: Sick
 * 4: Plus
 * 5: Planfrei & Urlaub
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
