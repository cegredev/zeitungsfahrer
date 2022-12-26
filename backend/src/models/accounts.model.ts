export type Role = "main" | "plan" | "accountAdmin" | "vendor";

export interface Account {
	name: string;
	role: Role;
}

export interface LoginInfo {
	username: string;
	role: Role;
	vendorId?: number;
}

export interface LoginResult {
	token: string;
	home: string;
	role: Role;
	/**
	 * Only present if role === "vendor"
	 */
	vendorId?: number;
}
