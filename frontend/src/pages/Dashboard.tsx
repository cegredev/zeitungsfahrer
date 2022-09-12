import { Vendor } from "backend/src/models/vendors.model";
import React from "react";
import { GET } from "../api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
	const navigate = useNavigate();

	const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
	const [vendors, setVendors] = React.useState<Vendor[]>([]);
	const [articles, setArticles] = React.useState<{ name: string; supply?: Number }[]>([]);

	React.useEffect(() => {
		async function fetchData() {
			const res = await GET("/vendors");
			const newVendors: Vendor[] = await res.json();
			setVendors(newVendors);

			setSelectedIndex(newVendors.findIndex((vendor) => vendor.active));

			const res2 = await GET("/todaysRecords/" + newVendors[selectedIndex].id);
			setArticles(await res2.json());
		}

		fetchData();
	}, [setVendors]);

	return (
		<div className="dashboard">
			<div className="vendors-left" style={{ display: "flex", flexDirection: "column", border: "solid 3px" }}>
				{vendors.map((vendor, i) => {
					return (
						<div
							key={"dashboard-vendor-" + vendor.id}
							style={{
								borderTop: i > 0 ? "solid 1px" : "",
								display: "flex",
								flexDirection: "row",
								backgroundColor: selectedIndex === i ? "gray" : i % 2 == 0 ? "white" : "lightgray",
								cursor: "default",
							}}
						>
							<div
								style={{ flex: 1, userSelect: "none", color: vendor.active ? "inherit" : "gray" }}
								onClick={async () => {
									if (!vendor.active) return;

									const articles = await GET("/todaysRecords/" + vendors[i].id);
									setArticles(await articles.json());
									setSelectedIndex(i);
								}}
								onDoubleClick={() => {
									if (!vendor.active) return;

									navigate("/records/" + vendor.id);
								}}
							>
								{vendor.lastName + ", " + vendor.firstName}
							</div>
							<input
								disabled={!vendor.active}
								checked={true}
								type="checkbox"
								name="done"
								readOnly={true}
							/>
						</div>
					);
				})}
			</div>
			<div style={{ display: "flex", flexDirection: "column", border: "solid 3px" }}>
				{articles.map((article, i) => {
					const showSupply = article.supply! > 0;

					return (
						<div
							key={"dashboard-vendor-" + article.name}
							style={{
								borderTop: i > 0 ? "solid 1px" : "",
								display: "flex",
								flexDirection: "row",
								backgroundColor: i % 2 == 0 ? "white" : "lightgray",
								cursor: "default",
							}}
						>
							<div style={{ flex: 1, userSelect: "none", color: showSupply ? "inherit" : "gray" }}>
								{article.name}
							</div>
							{showSupply && <div>{"" + article.supply}</div>}
						</div>
					);
				})}
			</div>
			<div>two</div>
		</div>
	);
}

export default Dashboard;
