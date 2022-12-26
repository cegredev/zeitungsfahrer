import React from "react";
import { DocMeta } from "backend/src/models/documents.model";
import { useAtom } from "jotai";
import { userInfoAtom } from "../stores/utility.store";
import { GET } from "../api";
import { SimpleVendor } from "backend/src/models/vendors.model";
import { useParams } from "react-router-dom";
import YearSelection from "../components/time/YearSelection";
import { useImmer } from "use-immer";
import LoadingPlaceholder from "../components/util/LoadingPlaceholder";
import dayjs from "dayjs";
import DocumentsMonth from "../components/DocumentsMonth";

const today = new Date();

function Documents() {
	const vendorId = parseInt(useParams().id || "0");

	const [date, setDate] = React.useState(today);
	const [userInfo] = useAtom(userInfoAtom);

	const [docs, setDocs] = useImmer<DocMeta[][]>([]);
	const [vendor, setVendor] = React.useState<SimpleVendor | undefined>();

	const currentMonth = date.getMonth();

	React.useEffect(() => {
		async function fetchData() {
			const docRes = await GET<DocMeta[]>(
				`/auth/${userInfo!.role}/documents/${vendorId}?date=${dayjs(date).format("YYYY-MM-DD")}&system=3`,
				userInfo!.token
			);

			const docsByMonth: DocMeta[][] = Array(currentMonth + 1)
				.fill(null)
				.map(() => []);

			for (const doc of docRes.data.map((doc) => ({
				...doc,
				date: new Date(doc.date),
			}))) {
				docsByMonth[currentMonth - doc.date.getMonth()].push(doc);
			}

			setDocs(docsByMonth);

			const vendorRes = await GET<SimpleVendor>(
				`/auth/${userInfo!.role}/vendors/${vendorId}?mode=simple`,
				userInfo!.token
			);
			setVendor(vendorRes.data);
		}

		fetchData();
	}, [vendorId, setDocs, setVendor, currentMonth, date, userInfo]);

	return (
		<div className="page" style={{ padding: 10 }}>
			{vendor ? (
				<>
					<div className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
						<h2 style={{ margin: 5 }}>
							{userInfo!.role === "vendor" ? "Hallo," : "Dokumente von"} {vendor?.name}
						</h2>
						<div>
							Jahr: <YearSelection date={date} setDate={setDate} />
						</div>
					</div>
					<div
						className="panel"
						style={{
							margin: 10,
							display: "flex",
							flexDirection: "column",
							textAlign: "center",
						}}
					>
						{docs.map((docs, i) => (
							<DocumentsMonth
								key={i}
								documents={docs}
								month={currentMonth - i}
								removeDoc={(id) => {
									setDocs((draft) => {
										const month = draft[i];

										month.splice(
											month.findIndex((doc) => doc.id === id),
											1
										);
									});
								}}
							/>
						))}
					</div>
				</>
			) : (
				<LoadingPlaceholder />
			)}
		</div>
	);
}

export default Documents;
