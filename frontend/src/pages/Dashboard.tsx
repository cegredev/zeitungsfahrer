import AuthorizedPage from "./AuthorizedPage";
import LeftPanel from "../components/dashboard/LeftPanel";
import ArticleSalesView from "../components/dashboard/ArticleSalesView";

function Dashboard() {
	return (
		<AuthorizedPage>
			<div className="dashboard" style={{ flex: 1 }}>
				<LeftPanel />
				<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
					<div>
						<ArticleSalesView />
					</div>
					<div>2</div>
					<div>3</div>
				</div>
			</div>
		</AuthorizedPage>
	);
}

export default Dashboard;
