const API_URL =
	process.env.NODE_ENV === "production" ? "https://zeitungsfahrer.herokuapp.com" : "http://localhost:3001";

async function makeRequest(method: string, route: string, body?: string, headers?: any): Promise<Response> {
	return await fetch(API_URL + route, {
		method,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		body,
	});
}

export async function GET(route: string, token?: string): Promise<Response> {
	return await makeRequest("GET", route, undefined, {
		authorization: token,
	});
}

export async function POST(route: string, body: any, token: string): Promise<Response> {
	return await makeRequest("POST", route, JSON.stringify(body), {
		authorization: token,
	});
}

export async function PUT(route: string, body: any, token: string): Promise<Response> {
	return await makeRequest("PUT", route, JSON.stringify(body), {
		authorization: token,
	});
}

export async function DELETE(route: string, body: any, token: string): Promise<Response> {
	return await makeRequest("DELETE", route, JSON.stringify(body), {
		authorization: token,
	});
}
