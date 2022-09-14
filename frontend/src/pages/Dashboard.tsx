import { Vendor } from "backend/src/models/vendors.model";
import React from "react";
import { GET } from "../api";
import { useNavigate } from "react-router-dom";
import { twoDecimalsFormat } from "../consts";
import dayjs from "dayjs";

function Dashboard() {
	const navigate = useNavigate();

	const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
	const [vendors, setVendors] = React.useState<Vendor[]>([]);
	const [articles, setArticles] = React.useState<{
		articles: { name: string; supply?: Number }[];
		totalValueBrutto: number;
	}>({ articles: [], totalValueBrutto: 0 });

	React.useEffect(() => {
		async function fetchData() {
			const res = await GET("/vendors");
			const newVendors: Vendor[] = (await res.json()).map((vendor: Vendor) => ({
				...vendor,
				lastRecordEntry: new Date(vendor.lastRecordEntry),
			}));
			setVendors(newVendors);

			const newIndex = newVendors.findIndex((vendor) => vendor.active);
			setSelectedIndex(newIndex);

			const res2 = await GET(`/records/${newVendors[newIndex].id}/today`);
			setArticles(await res2.json());
		}

		fetchData();
	}, [setVendors]);

	return (
		<div className="dashboard" style={{ flex: 1 }}>
			<div>
				<div style={{ backgroundColor: "lightgray", textAlign: "center", fontWeight: "bold" }}>Händler</div>
				<div
					className="vendors-left"
					style={{
						display: "flex",
						flexDirection: "column",
						border: "solid 3px",
						height: "100%",
						backgroundColor: "#EEEEEE",
					}}
				>
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
										const articles = await GET(`/records/${vendors[i].id}/today`);
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
									checked={
										dayjs(new Date()).subtract(1, "day").toDate().getTime() <
										vendor.lastRecordEntry.getTime()
									}
									type="checkbox"
									name="done"
									readOnly={true}
								/>
							</div>
						);
					})}
				</div>
			</div>
			<div>
				<div style={{ backgroundColor: "lightgray", textAlign: "center", fontWeight: "bold" }}>
					Summe: {twoDecimalsFormat.format(articles.totalValueBrutto)}
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						border: "solid 3px",
						height: "100%",
						backgroundColor: "#EEEEEE",
					}}
				>
					{articles.articles.map((article, i) => {
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
			</div>
			<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
				<div>1</div>
				<div>2</div>
				<div>3</div>
			</div>
		</div>
	);
}

export default Dashboard;
