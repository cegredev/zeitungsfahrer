import "./App.css";
import { Provider as JotaiProvider } from "jotai";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Error404 from "./pages/Error404";
import VendorPage from "./pages/VendorPage";
import Footer from "./components/Footer";
import Vendors from "./pages/Vendors";
import Articles from "./pages/Articles";

function App() {
	return (
		<Router>
			<JotaiProvider>
				<Navbar />

				<Routes>
					<Route path="/" element={<Dashboard />} />
					<Route path="/articles" element={<Articles />} />
					<Route path="/vendors" element={<Vendors />} />
					<Route path="/vendors/:id" element={<VendorPage />} />
					<Route path="*" element={<Error404 />} />
				</Routes>

				<Footer />
			</JotaiProvider>
		</Router>
	);
}

export default App;
