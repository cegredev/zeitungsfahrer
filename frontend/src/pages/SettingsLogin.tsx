import { useAtom } from "jotai";
import React from "react";
import { GET } from "../api";
import { authTokenAtom, settingsLoggedInAtom } from "../stores/utility.store";

function SettingsLogin() {
	const [password, setPassword] = React.useState("");
	const [waiting, setWaiting] = React.useState(false);
	const [, setSettingsLoggedIn] = useAtom(settingsLoggedInAtom);
	const [token] = useAtom(authTokenAtom);

	const login = React.useCallback(async () => {
		setWaiting(true);

		const response = await GET("/auth/settings/login?password=" + password, token);
		if (response.ok) setSettingsLoggedIn(true);

		setWaiting(false);
	}, [password, setSettingsLoggedIn, token]);

	return (
		<div className="page" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<h1>Einstellungen</h1>
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

export default SettingsLogin;
