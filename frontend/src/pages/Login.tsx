import { useAtom } from "jotai";
import React from "react";
import { GET } from "../api";
import { authTokenAtom } from "../stores/utility.store";

function Login() {
	const [, setToken] = useAtom(authTokenAtom);

	const [password, setPassword] = React.useState("");

	const [waiting, setWaiting] = React.useState(false);

	const login = React.useCallback(async () => {
		setWaiting(true);

		const response = await GET("/login?name=root&password=" + password);
		const token: string = (await response.json()).token;

		if (token != null) {
			setToken(token);
		}

		setWaiting(false);
	}, [password, setToken]);

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
