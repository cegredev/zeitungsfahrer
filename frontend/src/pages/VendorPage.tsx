import React from "react";

import { useParams } from "react-router-dom";

function VendorPage() {
	const id = parseInt(useParams().id!);

	return <div>Vendor {id}</div>;
}

export default VendorPage;
