import AuthorizedPage from "./AuthorizedPage";
import SalesOverview from "../components/dashboard/SalesOverview";
import ArticleSalesView from "../components/dashboard/ArticleSalesView";
import VendorSalesView from "../components/dashboard/VendorSalesView";
import AllSalesView from "../components/dashboard/AllSalesView";

function Dashboard() {
	return (
		<AuthorizedPage>
			<div className="dashboard" style={{ flex: 1 }}>
				<SalesOverview />
				<div style={{ display: "flex", flexDirection: "column", gap: "50px" }}>
					<ArticleSalesView />

					<VendorSalesView />

					<AllSalesView />
				</div>
			</div>
		</AuthorizedPage>
	);
}

export default Dashboard;
