import { useAtom } from "jotai";
import React from "react";
import { Link } from "react-router-dom";
import { GET, PUT } from "../../api";
import { settingsAtom } from "../../stores/settings.store";
import { authTokenAtom } from "../../stores/utility.store";
import { invoiceSystems } from "../../consts";
import { Settings as SettingsInterface } from "backend/src/models/settings.model";

function Settings() {
	const [settings, setSettings] = useAtom(settingsAtom);
	const [token] = useAtom(authTokenAtom);

	React.useEffect(() => {
		async function fetchSettings() {
			const response = await GET<SettingsInterface>("/auth/main/settings", token!);
			setSettings(response.data);
		}

		fetchSettings();
	}, [setSettings, token]);

	return (
		<div className="page">
			<div
				className="panel settings-left"
				style={{
					padding: 20,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 20,
				}}
			>
				<Link to="/vendors/create">Händler hinzufügen</Link>
				<Link to="/changePassword">Passwort ändern</Link>
				<div>
					Abrechnungen werden standardmäßig pro{" "}
					<select
						name="invoiceSystem"
						value={settings?.invoiceSystem}
						onChange={async (evt) => {
							const newSettings = { ...settings!, invoiceSystem: parseInt(evt.target.value) };

							await PUT("/auth/main/settings", newSettings, token!);

							setSettings(newSettings);
						}}
					>
						{invoiceSystems.map((system, i) => (
							<option key={"invoice-option-" + i} value={i}>
								{system}
							</option>
						))}
					</select>{" "}
					generiert.
				</div>
			</div>
		</div>
	);
}

export default Settings;
