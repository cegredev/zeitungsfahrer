import { Link } from "react-router-dom";

function Navbar() {
	return (
		<nav className="top-navbar">
			<Link style={{ paddingLeft: 10 }} to="/">
				Dashboard
			</Link>
			<Link to="/settings">Einstellungen</Link>
		</nav>
	);
}

export default Navbar;
