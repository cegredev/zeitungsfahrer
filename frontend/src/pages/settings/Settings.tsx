import { Link } from "react-router-dom";

function Settings() {
	return (
		<div className="page">
			<div
				className="panel settings-left"
				style={{
					padding: 20,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 20,
				}}
			>
				<Link to="/vendors/create">Händler hinzufügen</Link>
			</div>
		</div>
	);
}

export default Settings;
