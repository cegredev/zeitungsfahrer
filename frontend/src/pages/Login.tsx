import { useAtom } from "jotai";
import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { GET } from "../api";
import { authTokenAtom } from "../stores/utility.store";

function Login() {
	const [, setToken] = useAtom(authTokenAtom);
	const [password, setPassword] = React.useState("");
	const [waiting, setWaiting] = React.useState(false);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const login = React.useCallback(async () => {
		setWaiting(true);

		const response = await GET<{ token: string }>("/login?name=root&password=" + password);
		const token: string = response.data.token;

		if (token != null) {
			setToken(token);
		}

		setWaiting(false);

		const target = searchParams.get("target");
		console.log(target);
		navigate(target === null || target === "/login" ? "/" : target);
	}, [password, navigate, searchParams, setToken]);

	return (
		<div className="page" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<h1>Anmelden</h1>
			<form
				style={{ display: "flex", flexDirection: "column", gap: 5, margin: 30 }}
				onSubmit={async (evt) => {
					evt.preventDefault();
					await login();
				}}
			>
				<input
					type="text"
					disabled={waiting}
					value={password}
					name="password"
					placeholder="Passwort"
					onChange={(evt) => setPassword(evt.target.value)}
				/>
			</form>

			<button disabled={password.length === 0 || waiting} onClick={login}>
				Anmelden
			</button>
		</div>
	);
}

export default Login;
