import { Link } from "react-router-dom";

function Navbar() {
	return (
		<nav className="top-navbar">
			<Link to="/">Dashboard</Link>
			<Link to="/articles">Artikel</Link>
			<Link to="/vendors">Händler</Link>
			<Link to="/settings">Einstellungen</Link>
		</nav>
	);
}

export default Navbar;
