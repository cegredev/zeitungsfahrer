import { Vendor } from "backend/src/models/vendors.model";
import React from "react";
import { Link } from "react-router-dom";

function VendorItem({ vendor }: { vendor: Vendor }) {
	return (
		<div className="vendor-item">
			<h2>{vendor.name}</h2>
			<hr className="solid-divider" />
			<Link to={"" + vendor.id}>Details ansehen</Link>
		</div>
	);
}

export default VendorItem;
