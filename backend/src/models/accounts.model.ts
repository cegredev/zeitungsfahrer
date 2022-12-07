export type Role = "main" | "plan" | "accountAdmin";

export interface Account {
	name: string;
	role: Role;
}

export interface LoginResult {
	token: string;
	path: string;
	role: Role;
}
