import { Vendor } from "backend/src/models/vendors.model";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import Footer from "../../components/Footer";
import { authTokenAtom } from "../../components/stores/utility.store";
import { addVendorAtom, setVendorsAtom, vendorsListAtom } from "../../components/stores/vendors.store";
import VendorItem from "../../components/VendorItem";

function Vendors() {
	const [vendors] = useAtom(vendorsListAtom);
	const [, setVendors] = useAtom(setVendorsAtom);
	const [token] = useAtom(authTokenAtom);

	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		async function fetchVendors() {
			const response = await GET("/auth/vendors?includeInactive=true", token!);
			const vendors: Vendor[] = await response.json();

			console.log(vendors);

			setVendors(vendors);
			setLoading(false);
		}

		fetchVendors();
	}, [setVendors, token]);

	return (
		<div className="page vendors">
			{loading ? "Laden..." : vendors.map((vendor) => <VendorItem key={"vendor-" + vendor.id} vendor={vendor} />)}
			<Footer />
		</div>
	);
}

export default Vendors;
