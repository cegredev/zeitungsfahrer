import React from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthorizedPage from "../pages/AuthorizedPage";

interface Props {
	route: string;
	children: JSX.Element;
}

const links = [
	["/settings", "Allgemein"],
	["/articles", "Artikel"],
	["/vendors", "Händler"],
];

function SettingsNav({ route: activeRoute, children }: Props) {
	const leftNavWidth = 120;

	const navigate = useNavigate();

	return (
		<AuthorizedPage>
			<div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
				<div className="settings-nav" style={{ width: leftNavWidth }}>
					{links.map(([route, name]) => (
						<div
							key={"link-" + route + " " + name}
							style={{ backgroundColor: route === activeRoute ? "#999999" : "inherit" }}
						>
							<div onClick={() => navigate(route)}>
								<div>{name}</div>
							</div>
						</div>
					))}
				</div>
				<div style={{ flex: 1, padding: 20 }}>
					<div style={{ marginLeft: leftNavWidth }}>{children}</div>
				</div>
			</div>
		</AuthorizedPage>
	);
}

export default SettingsNav;
