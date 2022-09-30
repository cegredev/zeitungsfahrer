export interface District {
	id: number;
}

export interface DistrictWeek {
	district: District;
	vendorIds: number[];
}

export interface ScheduleInfo {
	districts: DistrictWeek[];
	vacation: number[][];
	free: number[][];
}
