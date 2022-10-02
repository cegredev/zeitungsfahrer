import { Vendor } from "backend/src/models/vendors.model";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import Footer from "../../components/Footer";
import { authTokenAtom } from "../../components/stores/utility.store";
import LoadingPlaceholder from "../../components/util/LoadingPlaceholder";
import VendorItem from "../../components/VendorItem";

function Vendors() {
	const [vendors, setVendors] = React.useState<Vendor[] | undefined>();

	const [token] = useAtom(authTokenAtom);

	React.useEffect(() => {
		async function fetchVendors() {
			setVendors(undefined);

			const response = await GET("/auth/vendors?includeInactive=true", token!);
			const vendors: Vendor[] = await response.json();

			setVendors(vendors);
		}

		fetchVendors();
	}, [setVendors, token]);

	return (
		<div className="page vendors">
			{vendors === undefined ? (
				<LoadingPlaceholder />
			) : (
				vendors.map((vendor) => <VendorItem key={"vendor-" + vendor.id} vendor={vendor} />)
			)}
			<Footer />
		</div>
	);
}

export default Vendors;
