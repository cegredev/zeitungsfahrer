import { SimpleVendor } from "./vendors.model";

export interface District {
	id: number;
}

export interface DistrictWeek {
	district: District;
	vendorIds: number[];
}

/**
 * 0: Working
 * 1: Planfrei
 * 2: Vacation
 * 3: Sick
 * 4: Plus
 * 5: Planfrei & Urlaub
 */
export type Activity = 0 | 1 | 2 | 3 | 4 | 5;

export interface ScheduleEntry {
	activity: Activity;
	district?: number;
}

export interface ScheduleEdit {
	calendar: ScheduleEntry[][];
	vendors: SimpleVendor[];
	districts: number[];
}

export interface ScheduleView {
	districts: DistrictWeek[];
	vacation: number[][];
	free: number[][];
	sick: number[][];
}
