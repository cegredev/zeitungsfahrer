import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import AuthorizedPage from "../pages/AuthorizedPage";
import SettingsLogin from "../pages/SettingsLogin";
import { settingsLoggedInAtom } from "../stores/utility.store";

interface Props {
	route: string;
	children: JSX.Element;
}

const links = [
	["/settings", "Allgemein"],
	["/articles", "Artikel"],
	["/vendors", "Händler"],
	["/calendar", "Kalender"],
	["/districtCalendar", "Bezirke"],
	["/schedule", "Einsatzplan"],
];

function SettingsNav({ route: activeRoute, children }: Props) {
	const leftNavWidth = 120;

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
