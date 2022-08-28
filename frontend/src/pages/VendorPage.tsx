import dayjs from "dayjs";
import React from "react";

import { useParams } from "react-router-dom";
import { GET } from "../api";
import TimeframeSelection from "../components/TimeframeSelection";

function VendorPage() {
	const id = parseInt(useParams().id!);

	async function fetchData(end: Date): Promise<void> {
		const response = await GET(`/vendors/${id}?end=${dayjs(end).format("YYYY-MM-DD")}`);
	}

	const [weekData, setWeekData] = React.useState(new Map());

	return (
		<div className="page">
			<TimeframeSelection onChange={fetchData} />
			Vendor {id}
		</div>
	);
}

export default VendorPage;
