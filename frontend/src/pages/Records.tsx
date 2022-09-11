import dayjs from "dayjs";
import React from "react";

import { useParams } from "react-router-dom";
import { GET } from "../api";
import TimeframeSelection from "../components/TimeframeSelection";
import { useAtom } from "jotai";
import { vendorRecordsAtom } from "../components/stores/vendor.store";
import ArticleRecordsItem from "../components/ArticleRecordsItem";

const _today = new Date();
const initialEndDate = dayjs(_today)
	.add((7 - _today.getDay()) % 7, "days")
	.toDate();

function Records() {
	const vendorId = parseInt(useParams().id!);

	const [vendorRecords, setVendorRecords] = useAtom(vendorRecordsAtom);

	const fetchData = React.useCallback(
		async (end: Date): Promise<void> => {
			const response = await GET(`/records/${vendorId}?end=${dayjs(end).format("YYYY-MM-DD")}`);
			const data = await response.json();

			setVendorRecords(data);
		},
		[vendorId, setVendorRecords]
	);

	React.useEffect(() => {
		fetchData(initialEndDate);
	}, [fetchData]);

	return (
		<div className="page">
			{vendorRecords == null ? (
				"Laden..."
			) : (
				<React.Fragment>
					<h1>{vendorRecords.name}</h1>
					<TimeframeSelection onChange={fetchData} startDate={initialEndDate} />
					{vendorRecords.articleRecords.map((articleRecords) => (
						<ArticleRecordsItem
							key={"vendor-week-" + vendorId + "-" + articleRecords.id + "-" + articleRecords.start}
							vendorId={vendorId}
							_records={articleRecords}
						/>
					))}
				</React.Fragment>
			)}
		</div>
	);
}

export default Records;
