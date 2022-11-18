import { useAtom } from "jotai";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GET } from "../api";
import { authTokenAtom, userRoleAtom } from "../stores/utility.store";
import { LoginResult } from "backend/src/models/accounts.model";

function Login() {
	const [, setToken] = useAtom(authTokenAtom);
	const [, setRole] = useAtom(userRoleAtom);
	const [password, setPassword] = React.useState("");
	const [username, setUsername] = React.useState("");
	const [waiting, setWaiting] = React.useState(false);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const login = React.useCallback(async () => {
		setWaiting(true);

		try {
			const response = await GET<LoginResult>(`/login?name=${username}&password=${password}`);
			setToken(response.data.token);
			setRole(response.data.role);

			const target = searchParams.get("target");
			navigate(target === null ? response.data.path : target);
		} catch {
			setPassword("");
		}

		setWaiting(false);
	}, [password, navigate, searchParams, setToken, setRole, username]);

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
					value={username}
					name="username"
					placeholder="Benutzername"
					onChange={(evt) => setUsername(evt.target.value)}
				/>
				<input
					type="password"
					disabled={waiting}
					value={password}
					name="password"
					placeholder="Passwort"
					onChange={(evt) => setPassword(evt.target.value)}
				/>
				<input type="submit" hidden />
			</form>

			<button disabled={username.length === 0 || password.length === 0 || waiting} onClick={login}>
				Anmelden
			</button>
		</div>
	);
}

export default Login;
