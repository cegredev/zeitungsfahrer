import { Vendor } from "backend/src/models/vendors.model";
import React from "react";
import { GET } from "../api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
	const navigate = useNavigate();

	const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
	const [vendors, setVendors] = React.useState<Vendor[]>([]);

	React.useEffect(() => {
		async function fetchData() {
			const res = await GET("/vendors");
			setVendors(await res.json());
		}

		fetchData();
	}, [setVendors]);

	return (
		<div className="dashboard">
			<div className="vendors-left" style={{ display: "flex", flexDirection: "column", border: "solid 3px" }}>
				{vendors.map((vendor, i) => (
					<div
						key={"dashboard-vendor-" + vendor.id}
						style={{
							borderTop: i > 0 ? "solid 1px" : "",
							display: "flex",
							flexDirection: "row",
							backgroundColor: selectedIndex === i ? "lightgray" : "",
							cursor: "default",
						}}
					>
						<div
							style={{ flex: 1, userSelect: "none" }}
							onClick={() => setSelectedIndex(i)}
							onDoubleClick={() => navigate("/records/" + vendor.id)}
						>
							{vendor.lastName + ", " + vendor.firstName}
						</div>
						<input checked={true} type="checkbox" name="done" readOnly={true} />
					</div>
				))}
			</div>
			<div style={{ display: "flex", flexDirection: "column", border: "solid 3px" }}>test</div>
			<div>two</div>
		</div>
	);
}

export default Dashboard;
