import dayjs from "dayjs";
import React from "react";

import { useParams } from "react-router-dom";
import { GET } from "../api";
import TimeframeSelection from "../components/TimeframeSelection";
import VendorWeekEntry from "../components/VendorWeekEntry";
import { useAtom } from "jotai";
import { setVendorWeekAtom, vendorWeekAtom } from "../components/stores/vendor.store";

function VendorPage() {
	const vendorId = parseInt(useParams().id!);

	const [vendorWeek] = useAtom(vendorWeekAtom);
	const [, setVendorWeek] = useAtom(setVendorWeekAtom);

	const fetchData = React.useCallback(
		async (end: Date): Promise<void> => {
			const response = await GET(`/vendors/${vendorId}?end=${dayjs(end).format("YYYY-MM-DD")}`);
			const data = await response.json();

			console.log(data);

			setVendorWeek(data);
		},
		[vendorId, setVendorWeek]
	);

	React.useEffect(() => {
		fetchData(new Date());
	}, [fetchData]);

	return (
		<div className="page">
			{vendorWeek == null ? (
				"Laden..."
			) : (
				<React.Fragment>
					<h1>{vendorWeek.name}</h1>
					<TimeframeSelection onChange={fetchData} />
					{vendorWeek.articleWeeks.map((articleWeek) => (
						<VendorWeekEntry
							key={"vendor-week-" + vendorId + "-" + articleWeek.id + "-" + articleWeek.start}
							articleWeek={articleWeek}
						/>
					))}
				</React.Fragment>
			)}
		</div>
	);
}

export default VendorPage;
