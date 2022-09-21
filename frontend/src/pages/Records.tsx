import dayjs from "dayjs";
import React from "react";

import { useParams } from "react-router-dom";
import { GET } from "../api";
import TimeframeSelection from "../components/TimeframeSelection";
import { useAtom } from "jotai";
import ArticleRecordsItem from "../components/ArticleRecordsItem";
import { twoDecimalsFormat } from "../consts";
import { VendorRecords } from "backend/src/models/records.model";
import { authTokenAtom } from "../components/stores/utility.store";
import AuthorizedPage from "./AuthorizedPage";

const _today = new Date();
const initialEndDate = dayjs(_today)
	.add((7 - _today.getDay()) % 7, "days")
	.toDate();

function Records() {
	const vendorId = parseInt(useParams().id!);

	const [vendorRecords, setVendorRecords] = React.useState<VendorRecords | undefined>(undefined);
	const [token] = useAtom(authTokenAtom);

	const fetchData = React.useCallback(
		async (end: Date): Promise<void> => {
			const response = await GET(`/auth/records/${vendorId}?end=${dayjs(end).format("YYYY-MM-DD")}`, token!);

			if (!response.ok) return;

			const data = await response.json();

			setVendorRecords({ ...data });
		},
		[vendorId, setVendorRecords, token]
	);

	React.useEffect(() => {
		fetchData(initialEndDate);
	}, [fetchData]);

	return (
		<AuthorizedPage>
			<div className="page">
				{vendorRecords == null ? (
					"Laden..."
				) : (
					<div style={{ maxWidth: 800, display: "flex", flexDirection: "column", alignItems: "center" }}>
						<h1>{vendorRecords.name}</h1>
						<TimeframeSelection onChange={fetchData} startDate={initialEndDate} />
						{vendorRecords.articleRecords.map((articleRecords) => (
							<ArticleRecordsItem
								key={"vendor-week-" + vendorId + "-" + articleRecords.id + "-" + articleRecords.start}
								vendorId={vendorId}
								_records={articleRecords}
							/>
						))}
					</div>
				)}
			</div>
		</AuthorizedPage>
	);
}

export default Records;
