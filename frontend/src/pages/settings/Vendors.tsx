import { Vendor } from "backend/src/models/vendors.model";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import Footer from "../../components/Footer";
import { addVendorAtom, setVendorsAtom, vendorsListAtom } from "../../components/stores/vendors.store";
import VendorItem from "../../components/VendorItem";

function Vendors() {
	const [vendors] = useAtom(vendorsListAtom);
	const [, setVendors] = useAtom(setVendorsAtom);
	const [, addVendor] = useAtom(addVendorAtom);

	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		async function fetchVendors() {
			const response = await GET("/vendors");
			const vendors: Vendor[] = await response.json();

			setVendors(vendors);
			setLoading(false);
		}

		fetchVendors();
	}, [setVendors]);

	return (
		<div className="page vendors">
			{loading ? "Laden..." : vendors.map((vendor) => <VendorItem key={"vendor-" + vendor.id} vendor={vendor} />)}
			<Footer />
		</div>
	);
}

export default Vendors;
