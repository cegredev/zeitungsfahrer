import React from "react";

function Login() {
	const [password, setPassword] = React.useState("");
	const [rememberMe, setRememberMe] = React.useState(true);

	const [waiting, setWaiting] = React.useState(false);

	const login = React.useCallback(async () => {
		setWaiting(true);
		console.log("Loggin in with", password, rememberMe);
		setWaiting(false);
	}, []);

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
