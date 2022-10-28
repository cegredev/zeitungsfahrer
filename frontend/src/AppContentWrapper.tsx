import { useAtom } from "jotai";
import React from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Popup from "reactjs-popup";
import { authTokenAtom, errorMessageAtom } from "./stores/utility.store";
import { settingsAtom } from "./stores/settings.store";

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
import Schedule from "./pages/Schedule";
import Calendar from "./pages/Calendar";
import { Settings as SettingsInterface } from "backend/src/models/settings.model";
import Login from "./pages/Login";
import DistrictCalendar from "./pages/settings/DistrictCalendar";

function AppContentWrapper() {
	const [errorMessage, setErrorMessage] = useAtom(errorMessageAtom);
	const [, setSettings] = useAtom(settingsAtom);
	const [token] = useAtom(authTokenAtom);
	const navigate = useNavigate();
	const location = useLocation();

	const clearErrorMessage = React.useCallback(() => setErrorMessage(""), [setErrorMessage]);

	React.useEffect(() => {
		if (token === undefined) return navigate("/login?target=" + location.pathname);

		async function fetchSettings() {
			const response = await GET<SettingsInterface>("/auth/settings", token!);

			const data = response.data;
			setSettings(data);
		}

		fetchSettings();

		// It wants location.pathname to be a dependency but that would lead to login always targeting login
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token, navigate, setSettings]);

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
				{token && <Navbar />}

				<Routes>
					<Route path="/login" element={<Login />} />
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
					<Route
						path="/calendar"
						element={
							<SettingsPage route="/calendar">
								<Calendar />
							</SettingsPage>
						}
					/>
					<Route
						path="/schedule"
						element={
							<SettingsPage route="/schedule">
								<Schedule />
							</SettingsPage>
						}
					/>
					<Route
						path="/districtCalendar"
						element={
							<SettingsPage route="/districtCalendar">
								<DistrictCalendar />
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
