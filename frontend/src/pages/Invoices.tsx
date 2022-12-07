import React from "react";
import { InvoiceLink } from "backend/src/models/invoices.model";
import { useAtom } from "jotai";
import { authTokenAtom, userRoleAtom } from "../stores/utility.store";
import { GET } from "../api";
import { SimpleVendor } from "backend/src/models/vendors.model";
import { useParams } from "react-router-dom";
import YearSelection from "../components/time/YearSelection";
import { months } from "../consts";
import { getKW } from "../components/time/WeekSelection";
import DownloadLink from "../components/DownloadLink";

const today = new Date();

function Invoices() {
	const id = parseInt(useParams().id || "0");

	const [date, setDate] = React.useState(today);
	const [token] = useAtom(authTokenAtom);
	const [role] = useAtom(userRoleAtom);

	const [invoices, setInvoices] = React.useState<InvoiceLink[][]>([]);
	const [vendor, setVendor] = React.useState<SimpleVendor | undefined>();

	const currentMonth = date.getMonth();

	React.useEffect(() => {
		async function fetchData() {
			const invoicesRes = await GET<InvoiceLink[]>(`/auth/${role}/invoices/${id}?date=${date}&system=3`, token!);

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

			setVendor((await GET<SimpleVendor>(`/auth/${role}/vendors/${id}?mode=simple`, token!)).data);
		}

		fetchData();
	}, [id, setInvoices, setVendor, currentMonth, date, role, token]);

	return (
		<div className="page" style={{ padding: 10 }}>
			{vendor && (
				<>
					<div className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
						<h2 style={{ margin: 5 }}>Rechnungen für {vendor?.name}</h2>
						<div>
							Jahr: <YearSelection date={date} setDate={setDate} />
						</div>
					</div>
					<div className="panel">
						{invoices.map((arr, i) => (
							<div key={i}>
								<h3>{months[currentMonth - i]}</h3>
								{arr.map((invoice) => (
									<div key={invoice.id}>
										<DownloadLink
											path={`/auth/${role}/invoices/download/${invoice.id}`}
											name={
												invoice.date.getFullYear() +
												"-" +
												getKW(invoice.date) +
												"-" +
												invoice.id
											}
										/>
									</div>
								))}
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}

export default Invoices;
