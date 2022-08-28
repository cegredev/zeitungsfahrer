const API_URL =
	process.env.NODE_ENV === "production" ? "https://zeitungsfahrer.herokuapp.com" : "http://localhost:3001";

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

export async function POST(route: string, body: any): Promise<Response> {
	return await makeRequest("POST", route, JSON.stringify(body));
}

export async function PUT(route: string, body: any): Promise<Response> {
	return await makeRequest("PUT", route, JSON.stringify(body));
}

export async function DELETE(route: string, body: any): Promise<Response> {
	return await makeRequest("DELETE", route, JSON.stringify(body));
}
