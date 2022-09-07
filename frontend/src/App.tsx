import "./App.css";
import { Provider as JotaiProvider } from "jotai";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Error404 from "./pages/Error404";
import VendorSettings from "./pages/VendorSettings";
import Footer from "./components/Footer";
import Vendors from "./pages/Vendors";
import Articles from "./pages/Articles";

import dayjs from "dayjs";
import weekofyear from "dayjs/plugin/weekOfYear";
import Settings from "./pages/Settings";

// @ts-ignore
dayjs.extend(window.dayjs_plugin_weekOfYear);

function App() {
	return (
		<Router>
			<JotaiProvider>
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
			</JotaiProvider>
		</Router>
	);
}

export default App;
