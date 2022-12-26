import { useAtom } from "jotai";
import React from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Popup from "reactjs-popup";
import { authTokenAtom, errorMessageAtom, userInfoAtom } from "./stores/utility.store";
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
import { chooseBasedOnRole } from "./consts";
import Invoices from "./pages/Invoices";
import InvoiceSettings from "./pages/settings/InvoiceSettings";

function AppContentWrapper() {
	const [errorMessage, setErrorMessage] = useAtom(errorMessageAtom);
	const [, setSettings] = useAtom(settingsAtom);
	const [userInfo] = useAtom(userInfoAtom);
	const navigate = useNavigate();
	const location = useLocation();

	const clearErrorMessage = React.useCallback(() => setErrorMessage(""), [setErrorMessage]);

	React.useEffect(() => {
		if (location.pathname === "/login") return;
		if (userInfo === undefined)
			return navigate("/login" + (location.pathname === "/" ? "" : "?target=" + location.pathname));

		async function fetchSettings() {
			const response = await GET<SettingsInterface>("/auth/" + userInfo!.role + "/settings", userInfo!.token!);

			const data = response.data;
			setSettings(data);
		}

		fetchSettings();

		// It wants location.pathname to be a dependency but that would lead to login always targeting login
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userInfo, navigate, setSettings]);

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

			<div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "100%" }}>
				{userInfo && (
					<Navbar
						links={chooseBasedOnRole(
							userInfo!.role,
							[
								{ name: "Dashboard", url: "/" },
								{ name: "Einstellungen", url: "/settings" },
							],
							[
								{ name: "Einsatzplan", url: "/schedule" },
								{ name: "Kalender", url: "/calendar" },
								{ name: "Bezirke", url: "/districts" },
							],
							[],
							[{ name: "Rechnungen", url: "/documents/" + userInfo.vendorId }]
						)}
					/>
				)}

				<Routes>
					<Route path="/login" element={<Login />} />

					{userInfo && (
						<React.Fragment>
							<Route
								path="/"
								element={<Navigate to={userInfo?.role === "main" ? "/dashboard" : "/schedule"} />}
							/>
							{chooseBasedOnRole(
								userInfo?.role,
								<>
									<Route path="/dashboard" element={<Dashboard />} />
									<Route path="/records/:id" element={<Records />} />
									<Route path="/documents/:id" element={<Invoices />} />
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
									/>
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
										path="/invoiceSettings"
										element={
											<SettingsPage route="/invoiceSettings">
												<InvoiceSettings />
											</SettingsPage>
										}
									/>
								</>,
								<>
									<Route path="/calendar" element={<Calendar />} />
									<Route path="/schedule" element={<Schedule />} />
									<Route path="/districts" element={<DistrictCalendar />} />
								</>,
								<>
									<Route path="/ADMIN STUFF HELp" element={<div />} />
								</>,
								<>
									<Route path={"/documents/:id"} element={<Invoices />} />
								</>
							)}
						</React.Fragment>
					)}
					<Route path="*" element={<Error404 />} />
				</Routes>
			</div>
		</React.Fragment>
	);
}

export default AppContentWrapper;
