import AuthorizedPage from "./AuthorizedPage";
import SalesOverview from "../components/dashboard/SalesOverview";
import ArticleSalesView from "../components/dashboard/ArticleSalesView";
import VendorSalesView from "../components/dashboard/VendorSalesView";
import AllSalesView from "../components/dashboard/AllSalesView";
import WeeklyBillView from "../components/dashboard/WeeklyBillView";
import { useAtom } from "jotai";
import { userInfoAtom } from "../stores/utility.store";

function Dashboard() {
	const [userInfo] = useAtom(userInfoAtom);

	return (
		<AuthorizedPage>
			<div className="dashboard" style={{ flex: 1 }}>
				<SalesOverview />
				{userInfo?.role === "main" && (
					<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
						<WeeklyBillView />

						<ArticleSalesView />

						<VendorSalesView />

						<AllSalesView />
					</div>
				)}
			</div>
		</AuthorizedPage>
	);
}

export default Dashboard;
