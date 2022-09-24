import { Link } from "react-router-dom";

function Navbar() {
	return (
		<nav className="top-navbar" style={{ zIndex: 2, position: "sticky", top: 0 }}>
			<Link style={{ paddingLeft: 10 }} to="/">
				Dashboard
			</Link>
			<Link to="/settings">Einstellungen</Link>
		</nav>
	);
}

export default Navbar;
