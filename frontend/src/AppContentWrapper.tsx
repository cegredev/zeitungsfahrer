import { useAtom } from "jotai";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Popup from "reactjs-popup";
import { errorMessageAtom } from "./components/stores/utility.store";
import { settingsAtom } from "./components/stores/settings.store";

import Navbar from "./components/Navbar";
import SettingsPage from "./components/SettingsPage";
import Dashboard from "./pages/Dashboard";
import Error404 from "./pages/Error404";
import VendorSettings from "./pages/VendorSettings";
import Vendors from "./pages/settings/Vendors";
import ArticleSettings from "./pages/settings/ArticleSettings";
import Records from "./pages/Records";
import Settings from "./pages/settings/Settings";
import { GET } from "./api";

function AppContentWrapper() {
	const [errorMessage, setErrorMessage] = useAtom(errorMessageAtom);
	const [, setSettings] = useAtom(settingsAtom);

	const clearErrorMessage = React.useCallback(() => setErrorMessage(""), [setErrorMessage]);

	React.useEffect(() => {
		async function fetchSettings() {
			const response = await GET("/settings");
			const data = await response.json();
			setSettings(data);
		}

		fetchSettings();
	}, [setSettings]);

	return (
		<React.Fragment>
			<Popup open={errorMessage.length > 0} closeOnDocumentClick onClose={clearErrorMessage}>
				<div className="modal">
					<div className="header" style={{ color: "red" }}>
						Fehler
					</div>
					<div className="content">{errorMessage}</div>
					<div className="actions">
						<button onClick={clearErrorMessage}>Okay</button>
					</div>
				</div>
			</Popup>

			<div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
				<Navbar />

				<Routes>
					<Route path="/" element={<Navigate to="/dashboard" />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/records/:id" element={<Records />} />
					<Route
						path="/articles"
						element={
							<SettingsPage route="/articles">
								<ArticleSettings />
							</SettingsPage>
						}
					/>{" "}
					<Route
						path="/vendors"
						element={
							<SettingsPage route="/vendors">
								<Vendors />
							</SettingsPage>
						}
					/>{" "}
					<Route
						path="/vendors/:id"
						element={
							<SettingsPage route="/vendors">
								<VendorSettings />
							</SettingsPage>
						}
					/>
					<Route
						path="/settings"
						element={
							<SettingsPage route="/settings">
								<Settings />
							</SettingsPage>
						}
					/>
					<Route path="*" element={<Error404 />} />
				</Routes>
			</div>
		</React.Fragment>
	);
}

export default AppContentWrapper;
