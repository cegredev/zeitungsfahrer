import axios, { AxiosResponse } from "axios";

const API_URL =
	process.env.NODE_ENV === "production" ? "https://zeitungsfahrer.herokuapp.com" : "http://localhost:3001";

export async function GET<T>(route: string, token?: string): Promise<AxiosResponse<T, any>> {
	return await axios.get(API_URL + route, {
		headers: {
			"Content-Type": "application/json",
			authorization: token,
		},
	});
}

export async function POST<T>(route: string, body: any, token: string): Promise<AxiosResponse<T, any>> {
	return await axios.post(API_URL + route, body, {
		headers: {
			"Content-Type": "application/json",
			authorization: token,
		},
	});
}

export async function PUT<T>(route: string, body: any, token: string): Promise<AxiosResponse<T, any>> {
	return await axios.put(API_URL + route, body, {
		headers: {
			"Content-Type": "application/json",
			authorization: token,
		},
	});
}

export async function DELETE<T>(route: string, token: string): Promise<AxiosResponse<T, any>> {
	return await axios.delete(API_URL + route, {
		headers: {
			"Content-Type": "application/json",
			authorization: token,
		},
	});
}
