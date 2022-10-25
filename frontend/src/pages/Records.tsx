import dayjs from "dayjs";
import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import { GET, POST } from "../api";
import TimeframeSelection from "../components/TimeframeSelection";
import { useAtom } from "jotai";
import ArticleRecordsItem, { GUIArticleRecords } from "../components/ArticleRecordsItem";
import { authTokenAtom } from "../stores/utility.store";
import AuthorizedPage from "./AuthorizedPage";
import YesNoPrompt from "../components/util/YesNoPrompt";
import { calculateTotalValueBrutto, twoDecimalsFormat } from "../consts";
import LoadingPlaceholder from "../components/util/LoadingPlaceholder";
import { VendorIncludedArticles } from "backend/src/models/vendors.model";
import { useImmer } from "use-immer";
import { ChangedRecord } from "backend/src/models/records.model";

const initialEndDate = new Date();

function Records() {
	const vendorId = parseInt(useParams().id!);
	const navigate = useNavigate();
	const [date, setDate] = React.useState(initialEndDate);

	const [info, setInfo] = React.useState<VendorIncludedArticles | undefined>();
	const [token] = useAtom(authTokenAtom);

	const [changedRecords, setChangedRecords] = useImmer<ChangedRecord[]>([]);
	const [recordsMap, setRecordsMap] = useImmer(new Map<number, GUIArticleRecords>());

	const addChangedRecord = React.useCallback(
		(changedRecord: ChangedRecord) => {
			setChangedRecords((draft) => {
				const duplicateIndex = draft.findIndex(
					(r) => r.date.getTime() === changedRecord.date.getTime() && r.articleId === changedRecord.articleId
				);

				if (duplicateIndex !== -1) draft.splice(duplicateIndex, 1);

				draft.push({
					date: changedRecord.date,
					articleId: changedRecord.articleId,
					remissions: changedRecord.remissions,
					supply: changedRecord.supply,
				});
			});
		},
		[setChangedRecords]
	);

	React.useEffect(() => {
		async function fetchData() {
			const response = await GET(`/auth/vendors/${vendorId}/includedArticles`, token!);
			if (!response.ok) return;

			const data = await response.json();

			setInfo(data);
		}

		fetchData();
	}, [vendorId, setInfo, token]);

	return (
		<AuthorizedPage>
			<div className="page">
				{info === undefined ? (
					<LoadingPlaceholder />
				) : (
					<div style={{ maxWidth: 800, display: "flex", flexDirection: "column", alignItems: "center" }}>
						<h1>{info.name}</h1>
						<div className="records-control" style={{ zIndex: 2, position: "sticky", top: 50 }}>
							{changedRecords.length > 0 ? (
								<YesNoPrompt
									trigger={<button style={{ color: "red" }}>Zurück</button>}
									header="Zurück"
									content={`Sie haben ungespeicherte Änderungen! Wollen Sie die Seite wirklich verlassen?`}
									onYes={async () => {
										navigate(-1);
									}}
								/>
							) : (
								<button style={{ color: "red" }} onClick={() => navigate(-1)}>
									Zurück
								</button>
							)}
							<TimeframeSelection onChange={(date) => setDate(date)} startDate={initialEndDate} />
							<YesNoPrompt
								trigger={<button style={{ color: "green" }}>Speichern</button>}
								header="Speichern"
								content={`Wollen Sie das gewählte Element wirklich speichern?`}
								onYes={async () => {
									await POST(`/auth/records/${vendorId}`, changedRecords, token!);

									setChangedRecords([]);

									setRecordsMap((draft) => {
										draft!.forEach(
											(aRecords) =>
												(aRecords.records = aRecords.records.map((r) => ({
													...r,
													missing: !r.edited && r.missing,
													edited: false,
													editable: r.edited ? false : r.editable,
												})))
										);
									});
								}}
							/>
						</div>
						<h3 style={{ padding: 5, backgroundColor: "lightgray", borderRadius: 5 }}>
							Gesamt (Brutto):{" "}
							{twoDecimalsFormat.format(
								[...recordsMap.values()]
									.map((r) => calculateTotalValueBrutto(r.records))
									.reduce((a, b) => a + b, 0)
							)}
						</h3>
						{info.articleIds.map((id) => (
							<ArticleRecordsItem
								key={"vendor-week-" + id}
								vendorId={vendorId}
								articleId={id}
								date={date}
								recordsMap={recordsMap}
								setRecords={setRecordsMap}
								addChangedRecord={addChangedRecord}
							/>
						))}
					</div>
				)}
			</div>
		</AuthorizedPage>
	);
}

export default Records;
