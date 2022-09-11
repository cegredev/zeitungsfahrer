import { useAtom } from "jotai";
import React from "react";
import { Route, Routes } from "react-router-dom";
import Popup from "reactjs-popup";
import { errorMessageAtom } from "./components/stores/utility.store";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Error404 from "./pages/Error404";
import VendorSettings from "./pages/VendorSettings";
import Footer from "./components/Footer";
import Vendors from "./pages/Vendors";
import Articles from "./pages/Articles";
import Settings from "./pages/Settings";

function AppContentWrapper() {
	const [errorMessage, setErrorMessage] = useAtom(errorMessageAtom);

	const clearErrorMessage = React.useCallback(() => setErrorMessage(""), []);

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

			<Navbar />

			<Routes>
				<Route path="/" element={<Dashboard />} />
				<Route path="/articles" element={<Articles />} />
				<Route path="/vendors" element={<Vendors />} />
				<Route path="/vendors/:id" element={<VendorSettings />} />
				<Route path="/settings" element={<Settings />} />
				<Route path="*" element={<Error404 />} />
			</Routes>

			<Footer />
		</React.Fragment>
	);
}

export default AppContentWrapper;
