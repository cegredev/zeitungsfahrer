import axios, { AxiosResponse } from "axios";
import { LoginResult } from "backend/src/models/accounts.model";

const API_URL = process.env.NODE_ENV === "production" ? "https://touren-fahrer.com/api" : "http://localhost:3001/api";

export async function GET<T, D = any>(route: string, token?: string): Promise<AxiosResponse<T, D>> {
	return await axios.get(API_URL + route, {
		headers: {
			"Content-Type": "application/json",
			authorization: token,
		},
	});
}

export async function GET_BLOB(route: string, token?: string): Promise<AxiosResponse<Blob>> {
	return await axios.get(API_URL + route, {
		headers: {
			"Content-Type": "application/json",
			authorization: token,
		},
		responseType: "blob",
	});
}

export async function POST<T, D = any>(route: string, body: any, token: string): Promise<AxiosResponse<T, D>> {
	return await axios.post(API_URL + route, body, {
		headers: {
			"Content-Type": "application/json",
			authorization: token,
		},
	});
}

export async function LOGIN(name: string, password: string): Promise<AxiosResponse<LoginResult>> {
	return await axios.post(
		API_URL + "/login",
		{
			name,
			password,
		},
		{
			headers: {
				"Content-Type": "application/json",
			},
		}
	);
}

export async function POST_BLOB(route: string, token?: string): Promise<AxiosResponse<Blob>> {
	return await axios.post(API_URL + route, undefined, {
		headers: {
			"Content-Type": "application/json",
			authorization: token,
		},
		responseType: "blob",
	});
}

export async function PUT<T, D = any>(route: string, body: any, token: string): Promise<AxiosResponse<T, D>> {
	return await axios.put(API_URL + route, body, {
		headers: {
			"Content-Type": "application/json",
			authorization: token,
		},
	});
}

export async function DELETE<T, D = any>(route: string, token: string): Promise<AxiosResponse<T, D>> {
	return await axios.delete(API_URL + route, {
		headers: {
			"Content-Type": "application/json",
			authorization: token,
		},
	});
}
