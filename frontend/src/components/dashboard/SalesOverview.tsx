import { DashboardRecords } from "backend/src/models/records.model";
import { DashboardVendor } from "backend/src/models/vendors.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { useNavigate } from "react-router-dom";
import { GET } from "../../api";
import { twoDecimalsFormat } from "../../consts";
import { authTokenAtom, userInfoAtom } from "../../stores/utility.store";

function SalesOverview() {
	const navigate = useNavigate();

	const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
	const [vendors, setVendors] = React.useState<DashboardVendor[]>([]);
	const [articles, setArticles] = React.useState<DashboardRecords>({ articles: [], totalValueBrutto: 0 });

	const [userInfo] = useAtom(userInfoAtom);

	React.useEffect(() => {
		async function fetchData() {
			const res = await GET<DashboardVendor[]>(`/auth/${userInfo?.role}/dashboard/vendors`, userInfo?.token);
			const vendors = res.data;
			setVendors(vendors);

			if (vendors.length > 0) {
				const articleRes = await GET<DashboardRecords>(
					`/auth/${userInfo?.role}/records/${vendors[0].id}/today`,
					userInfo?.token
				);
				setArticles(articleRes.data);
			}
		}

		fetchData();
	}, [setVendors, userInfo]);

	return (
		<>
			<div style={{ display: "flex", flexDirection: "column" }}>
				<div style={{ backgroundColor: "lightgray", textAlign: "center", fontWeight: "bold" }}>Händler</div>
				<div
					className="vendors-left"
					style={{
						display: "flex",
						flexDirection: "column",
						border: "solid 2px",
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
									}}
									onClick={async () => {
										setSelectedIndex(i);
										setArticles({
											articles: [],
											totalValueBrutto: 0,
										});
										const articles = await GET<DashboardRecords>(
											`/auth/${userInfo?.role}/records/${vendors[i].id}/today`,
											userInfo?.token
										);
										setArticles(articles.data);
									}}
									onDoubleClick={() => {
										navigate("/records/" + vendor.id);
									}}
								>
									{vendor.name}
								</div>
								<input checked={vendor.checked} type="checkbox" name="done" readOnly={true} />
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
						border: "solid 2px",
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
								{<div>{"" + article.supply}</div>}
							</div>
						);
					})}
				</div>
			</div>
		</>
	);
}

export default SalesOverview;
