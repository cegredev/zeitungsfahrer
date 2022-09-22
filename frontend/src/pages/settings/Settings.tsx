import { useAtom } from "jotai";
import React from "react";
import { Link } from "react-router-dom";
import { GET, PUT } from "../../api";
import { settingsAtom } from "../../components/stores/settings.store";
import { authTokenAtom } from "../../components/stores/utility.store";
import { invoiceSystems } from "../../consts";

function Settings() {
	const [settings, setSettings] = useAtom(settingsAtom);
	const [token] = useAtom(authTokenAtom);

	React.useEffect(() => {
		async function fetchSettings() {
			const response = await GET("/auth/settings", token!);
			const data = await response.json();
			setSettings(data);
		}

		fetchSettings();
	}, [setSettings, token]);

	return (
		<div className="page">
			<div
				className="settings-left"
				style={{
					padding: 30,
					backgroundColor: "lightgray",
					borderRadius: 10,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 20,
				}}
			>
				<Link to="/vendors/create">Händler hinzufügen</Link>
				<div>
					Abrechnungen werden standardmäßig pro{" "}
					<select
						name="invoiceSystem"
						value={settings?.invoiceSystem}
						onChange={async (evt) => {
							const newSettings = { ...settings!, invoiceSystem: parseInt(evt.target.value) };

							await PUT("/auth/settings", newSettings, token!);

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
