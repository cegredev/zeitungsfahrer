export interface Account {
	name: string;
	role: number;
}

export interface LoginResult {
	token: string;
	path: string;
	role: number;
}
