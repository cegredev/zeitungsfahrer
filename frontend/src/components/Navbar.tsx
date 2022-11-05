import { Link } from "react-router-dom";

interface Props {
	links: {
		name: string;
		url: string;
	}[];
}

function Navbar({ links }: Props) {
	return (
		<nav className="top-navbar" style={{ zIndex: 2, position: "sticky", top: 0 }}>
			<Link style={{ paddingLeft: 10 }} to={links[0].url}>
				{links[0].name}
			</Link>
			{links.slice(1).map((link, i) => (
				<Link key={i} to={link.url}>
					{link.name}
				</Link>
			))}
		</nav>
	);
}

export default Navbar;
