import { DashboardRecords } from "backend/src/models/records.model";
import { Vendor } from "backend/src/models/vendors.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { useNavigate } from "react-router-dom";
import { GET } from "../../api";
import { twoDecimalsFormat } from "../../consts";
import { authTokenAtom } from "../stores/utility.store";

function LeftPanel() {
	const navigate = useNavigate();

	const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
	const [vendors, setVendors] = React.useState<Vendor[]>([]);
	const [articles, setArticles] = React.useState<DashboardRecords>({ articles: [], totalValueBrutto: 0 });

	const [token] = useAtom(authTokenAtom);

	React.useEffect(() => {
		async function fetchData() {
			const res = await GET("/auth/vendors?includeInactive=false", token!);
			const newVendors: Vendor[] = (await res.json()).map((vendor: Vendor) => ({
				...vendor,
				lastRecordEntry: new Date(vendor.lastRecordEntry),
			}));
			setVendors(newVendors);

			const newIndex = newVendors.findIndex((vendor) => vendor.active);
			setSelectedIndex(newIndex);

			const articleRes = await GET(`/auth/records/${newVendors[newIndex].id}/today`, token!);
			setArticles(await articleRes.json());
		}

		fetchData();
	}, [setVendors, token]);

	return (
		<>
			<div style={{ display: "flex", flexDirection: "column" }}>
				<div style={{ backgroundColor: "lightgray", textAlign: "center", fontWeight: "bold" }}>Händler</div>
				<div
					className="vendors-left"
					style={{
						display: "flex",
						flexDirection: "column",
						border: "solid 3px",
						// height: "100%",
						flex: 1,
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
									backgroundColor: selectedIndex === i ? "gray" : i % 2 === 0 ? "white" : "lightgray",
									cursor: "default",
								}}
							>
								<div
									style={{
										flex: 1,
										userSelect: "none",
										color: vendor.active ? "inherit" : "gray",
									}}
									onClick={async () => {
										if (!vendor.active) return;
										setSelectedIndex(i);
										setArticles({
											articles: [],
											totalValueBrutto: 0,
										});
										const articles = await GET(`/auth/records/${vendors[i].id}/today`, token!);
										setArticles(await articles.json());
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
			<div style={{ display: "flex", flexDirection: "column" }}>
				<div style={{ backgroundColor: "lightgray", textAlign: "center", fontWeight: "bold" }}>
					Summe: {twoDecimalsFormat.format(articles.totalValueBrutto)}
				</div>
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						border: "solid 3px",
						backgroundColor: "#EEEEEE",
					}}
				>
					{articles.articles.map((article, i) => {
						return (
							<div
								key={"dashboard-vendor-" + article.name}
								style={{
									borderTop: i > 0 ? "solid 1px" : "",
									display: "flex",
									flexDirection: "row",
									backgroundColor: i % 2 === 0 ? "white" : "lightgray",
									cursor: "default",
								}}
							>
								<div style={{ flex: 1, userSelect: "none" }}>{article.name}</div>
								{<div>{"" + article.sales}</div>}
							</div>
						);
					})}
				</div>
			</div>
		</>
	);
}

export default LeftPanel;
