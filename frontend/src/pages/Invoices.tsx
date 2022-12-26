import React from "react";
import { DocMeta } from "backend/src/models/documents.model";
import { useAtom } from "jotai";
import { userInfoAtom } from "../stores/utility.store";
import { DELETE, GET, GET_BLOB } from "../api";
import { SimpleVendor } from "backend/src/models/vendors.model";
import { useParams } from "react-router-dom";
import YearSelection from "../components/time/YearSelection";
import { months } from "../consts";
import DownloadLink from "../components/DownloadLink";
import { useImmer } from "use-immer";
import YesNoPrompt from "../components/util/YesNoPrompt";
import { downloadUrl } from "../files";
import LoadingPlaceholder from "../components/util/LoadingPlaceholder";
import dayjs from "dayjs";

const today = new Date();

function Invoices() {
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
							width: "30vw",
							textAlign: "center",
						}}
					>
						{docs.map((arr, monthDesc) => (
							<div key={monthDesc}>
								<h3 style={{ margin: 5 }}>{months[currentMonth - monthDesc]}</h3>
								{arr.map((doc) => {
									const docName = doc.id + "-" + doc.description;

									return (
										<div
											key={docName}
											style={{
												display: "flex",
												flexDirection: "row",
												justifyContent: "space-between",
											}}
										>
											<DownloadLink
												path={`/auth/${userInfo!.role}/documents/download/${doc.type}/${
													doc.id
												}`}
												name={docName}
												format={doc.format}
											/>
											<div>
												{userInfo!.role === "main" && (
													<YesNoPrompt
														content="Wollen Sie dieses Dokument wirklich löschen?"
														header="Dokument löschen?"
														trigger={<button>Löschen</button>}
														onYes={async () => {
															await DELETE(
																`/auth/main/documents?type=${doc.type}&id=${doc.id}`,
																userInfo!.token!
															);

															setDocs((draft) => {
																const month = draft[monthDesc];
																month.splice(
																	month.findIndex((inv) => inv.id === doc.id),
																	1
																);
															});
														}}
													/>
												)}
												<button
													onClick={async () => {
														const response = await GET_BLOB(
															`/auth/${userInfo!.role}/documents/download/${doc.type}/${
																doc.id
															}`,
															userInfo!.token
														);

														const url = URL.createObjectURL(response.data);
														downloadUrl(url, docName + "." + doc.format);
													}}
												>
													Herunterladen
												</button>
											</div>
										</div>
									);
								})}
							</div>
						))}
					</div>
				</>
			) : (
				<LoadingPlaceholder />
			)}
		</div>
	);
}

export default Invoices;
