import React from "react";
import { Link } from "react-router-dom";
import AuthorizedPage from "../pages/AuthorizedPage";

interface Props {
	children: JSX.Element;
}

function SettingsNav({ children }: Props) {
	const leftNavWidth = 100;

	return (
		<AuthorizedPage>
			<div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
				<div className="settings-nav" style={{ width: leftNavWidth }}>
					<Link to="/settings">Allgemein</Link>
					<Link to="/articles">Artikel</Link>
					<Link to="/vendors">Händler</Link>
				</div>
				<div style={{ flex: 1, padding: 20 }}>
					<div style={{ marginLeft: leftNavWidth }}>{children}</div>
				</div>
			</div>
		</AuthorizedPage>
	);
}

export default SettingsNav;
