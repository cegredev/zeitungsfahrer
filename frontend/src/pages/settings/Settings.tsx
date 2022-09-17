import React from "react";
import { Link } from "react-router-dom";

function Settings() {
	return (
		<div className="page">
			<div className="settings-left" style={{ padding: 30, backgroundColor: "lightgray", borderRadius: 10 }}>
				<Link to="/vendors/create">Händler hinzufügen</Link>
			</div>
		</div>
	);
}

export default Settings;
