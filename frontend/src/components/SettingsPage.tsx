import { useAtom } from "jotai";
import React from "react";
import { useNavigate } from "react-router-dom";
import AuthorizedPage from "../pages/AuthorizedPage";
import SettingsLogin from "../pages/SettingsLogin";
import { settingsLoggedInAtom, userInfoAtom } from "../stores/utility.store";

interface Props {
	route: string;
	children: JSX.Element;
}

function SettingsNav({ route: activeRoute, children }: Props) {
	const leftNavWidth = 135;

	const [userInfo] = useAtom(userInfoAtom);

	const [links, setLinks] = React.useState<[string, string][]>([]);

	React.useEffect(() => {
		let links: [string, string][] = [];

		switch (userInfo?.role) {
			case "main":
				links = [
					["/settings", "Allgemein"],
					["/articles", "Artikel"],
					["/vendors", "Händler"],
					["/invoiceSettings", "Rechnungen"],
				];
				break;
		}

		links.push(["/changePassword", "Account"]);

		setLinks(links);
	}, [userInfo]);

	const navigate = useNavigate();
	const [settingsLoggedIn] = useAtom(settingsLoggedInAtom);

	return (
		<AuthorizedPage>
			{settingsLoggedIn ? (
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
			) : (
				<SettingsLogin />
			)}
		</AuthorizedPage>
	);
}

export default SettingsNav;
