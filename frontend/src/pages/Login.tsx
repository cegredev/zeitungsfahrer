import { useAtom } from "jotai";
import React from "react";
import { GET } from "../api";
import { authTokenAtom } from "../components/stores/utility.store";

function Login() {
	const [, setToken] = useAtom(authTokenAtom);

	const [password, setPassword] = React.useState("");
	const [rememberMe, setRememberMe] = React.useState(true);

	const [waiting, setWaiting] = React.useState(false);

	const login = React.useCallback(async () => {
		setWaiting(true);

		const response = await GET("/login?name=root&password=" + password + "&rememberMe=" + rememberMe);
		const token: string = (await response.json()).token;

		if (token != null) {
			setToken(token);
			localStorage.setItem("token", token);
		}

		setWaiting(false);
	}, [password, rememberMe, setToken]);

	return (
		<div className="page" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
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

				<div>
					<input
						type="checkbox"
						disabled={waiting}
						name="rememberMe"
						checked={rememberMe}
						onChange={() => setRememberMe(!rememberMe)}
					/>
					<label htmlFor="rememberMe">Angemeldet bleiben</label>
				</div>
			</form>

			<button disabled={password.length === 0 || waiting} onClick={login}>
				Anmelden
			</button>
		</div>
	);
}

export default Login;
