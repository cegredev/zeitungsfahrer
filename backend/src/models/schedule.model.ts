export interface District {
	id: number;
}

export interface DistrictWeek {
	vendorIds: number[];
}

export interface ScheduleInfo {
	districts: DistrictWeek[];
}
