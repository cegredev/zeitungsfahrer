import React from "react";
import { InvoiceLink } from "backend/src/models/invoices.model";
import { useAtom } from "jotai";
import { authTokenAtom, userInfoAtom } from "../stores/utility.store";
import { DELETE, GET, GET_BLOB } from "../api";
import { SimpleVendor } from "backend/src/models/vendors.model";
import { useParams } from "react-router-dom";
import YearSelection from "../components/time/YearSelection";
import { months } from "../consts";
import { getKW } from "../components/time/WeekSelection";
import DownloadLink from "../components/DownloadLink";
import { useImmer } from "use-immer";
import YesNoPrompt from "../components/util/YesNoPrompt";
import { downloadUrl } from "../files";
import LoadingPlaceholder from "../components/util/LoadingPlaceholder";
import dayjs from "dayjs";

const today = new Date();

function Invoices() {
	const id = parseInt(useParams().id || "0");

	const [date, setDate] = React.useState(today);
	const [userInfo] = useAtom(userInfoAtom);

	const [invoices, setInvoices] = useImmer<InvoiceLink[][]>([]);
	const [vendor, setVendor] = React.useState<SimpleVendor | undefined>();

	const currentMonth = date.getMonth();

	React.useEffect(() => {
		async function fetchData() {
			const invoicesRes = await GET<InvoiceLink[]>(
				`/auth/${userInfo!.role}/invoices/${id}?date=${dayjs(date).format("YYYY-MM-DD")}&system=3`,
				userInfo!.token
			);

			const invoicesByMonth: InvoiceLink[][] = Array(currentMonth + 1)
				.fill(null)
				.map(() => []);

			for (const invoice of invoicesRes.data.map((invoice) => ({
				...invoice,
				date: new Date(invoice.date),
			}))) {
				invoicesByMonth[currentMonth - invoice.date.getMonth()].push(invoice);
			}

			setInvoices(invoicesByMonth);

			const vendorRes = await GET<SimpleVendor>(
				`/auth/${userInfo!.role}/vendors/${id}?mode=simple`,
				userInfo!.token
			);
			setVendor(vendorRes.data);
		}

		fetchData();
	}, [id, setInvoices, setVendor, currentMonth, date, userInfo]);

	return (
		<div className="page" style={{ padding: 10 }}>
			{vendor ? (
				<>
					<div className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
						<h2 style={{ margin: 5 }}>
							{userInfo!.role === "vendor" ? "Hallo," : "Rechnungen für"} {vendor?.name}
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
						{invoices.map((arr, monthDesc) => (
							<div key={monthDesc}>
								<h3 style={{ margin: 5 }}>{months[currentMonth - monthDesc]}</h3>
								{arr.map((invoice) => {
									const invoiceName =
										invoice.date.getFullYear() + "-" + getKW(invoice.date) + "-" + invoice.id;

									return (
										<div
											key={invoice.id}
											style={{
												display: "flex",
												flexDirection: "row",
												justifyContent: "space-between",
											}}
										>
											<DownloadLink
												path={`/auth/${userInfo!.role}/invoices/download/${invoice.id}`}
												name={invoiceName}
											/>
											<div>
												{userInfo!.role === "main" && (
													<YesNoPrompt
														content="Wollen Sie diese Rechnung wirklich löschen?"
														header="Rechnung löschen?"
														trigger={<button>Löschen</button>}
														onYes={async () => {
															await DELETE(
																"/auth/main/invoices/" + invoice.id,
																userInfo!.token!
															);

															setInvoices((draft) => {
																const month = draft[monthDesc];
																month.splice(
																	month.findIndex((inv) => inv.id === invoice.id),
																	1
																);
															});
														}}
													/>
												)}
												<button
													onClick={async () => {
														const response = await GET_BLOB(
															`/auth/${userInfo!.role}/invoices/download/` + invoice.id,
															userInfo!.token
														);

														const url = URL.createObjectURL(response.data);
														downloadUrl(url, invoiceName + ".pdf");
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
