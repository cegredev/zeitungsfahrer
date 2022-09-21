import AuthorizedPage from "./AuthorizedPage";
import LeftPanel from "../components/dashboard/LeftPanel";
import ArticleSalesView from "../components/dashboard/ArticleSalesView";
import VendorSalesView from "../components/dashboard/VendorSalesView";
import AllSalesView from "../components/dashboard/AllSalesView";

function Dashboard() {
	return (
		<AuthorizedPage>
			<div className="dashboard" style={{ flex: 1 }}>
				<LeftPanel />
				<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
					<div>
						<ArticleSalesView />
					</div>
					<div>
						<VendorSalesView />
					</div>
					<div>
						<AllSalesView />
					</div>
				</div>
			</div>
		</AuthorizedPage>
	);
}

export default Dashboard;
