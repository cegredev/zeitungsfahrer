const API_URL = "http://localhost:3000/";

async function makeRequest(method: string, route: string, body?: string, headers?: any): Promise<Response> {
	return await fetch(API_URL + route, {
		method,
		headers: headers || {
			"Content-Type": "application/json",
		},
		body,
	});
}

export async function GET(route: string): Promise<Response> {
	return await makeRequest("GET", route);
}

export async function PUT(route: string, body: string) {
	await makeRequest("PUT", route, body);
}
