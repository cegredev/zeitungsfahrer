import dayjs from "dayjs";
import React from "react";

import { useParams } from "react-router-dom";
import { GET, PUT } from "../api";
import TimeframeSelection from "../components/TimeframeSelection";
import VendorWeekEntry from "../components/VendorWeekEntry";
import { useAtom } from "jotai";
import { setVendorWeekAtom, vendorWeekAtom } from "../components/stores/vendor.store";

const _today = new Date();
const initialEndDate = dayjs(_today)
	.add((7 - _today.getDay()) % 7, "days")
	.toDate();

function VendorPage() {
	const vendorId = parseInt(useParams().id!);

	const [vendorWeek] = useAtom(vendorWeekAtom);
	const [, setVendorWeek] = useAtom(setVendorWeekAtom);

	const fetchData = React.useCallback(
		async (end: Date): Promise<void> => {
			const response = await GET(`/vendors/${vendorId}?end=${dayjs(end).format("YYYY-MM-DD")}`);
			const data = await response.json();

			setVendorWeek(data);
		},
		[vendorId, setVendorWeek]
	);

	React.useEffect(() => {
		fetchData(initialEndDate);
	}, [fetchData]);

	return (
		<div className="page">
			{vendorWeek == null ? (
				"Laden..."
			) : (
				<React.Fragment>
					<input
						className="large-input"
						value={vendorWeek.name}
						onChange={(evt) => {
							setVendorWeek({ ...vendorWeek, name: evt.target.value });
						}}
						onBlur={() => {
							PUT("/vendors", { id: vendorId, name: vendorWeek.name });
						}}
					/>
					<TimeframeSelection onChange={fetchData} startDate={initialEndDate} />
					{vendorWeek.articleWeeks.map((articleWeek) => (
						<VendorWeekEntry
							key={"vendor-week-" + vendorId + "-" + articleWeek.id + "-" + articleWeek.start}
							vendorId={vendorId}
							articleWeek={articleWeek}
						/>
					))}
				</React.Fragment>
			)}
		</div>
	);
}

export default VendorPage;
