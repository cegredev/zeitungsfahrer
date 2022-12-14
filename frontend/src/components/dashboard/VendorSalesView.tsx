import { VendorSales } from "backend/src/models/records.model";
import { ReportType } from "backend/src/models/reports.model";
import { SimpleVendor } from "backend/src/models/vendors.model";
import Big from "big.js";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import { twoDecimalsFormat } from "../../consts";
import { authTokenAtom, userInfoAtom } from "../../stores/utility.store";
import DateSelection from "../time/DateSelection";
import MonthSelection from "../time/MonthSelection";
import WeekSelection from "../time/WeekSelection";
import YearSelection from "../time/YearSelection";
import ReportButton from "./ReportButton";
import ReportTypeSelection from "./ReportTypeSelection";

function VendorSalesView() {
	const [vendorSales, setVendorSales] = React.useState<VendorSales | undefined>(undefined);
	const [vendorId, setVendorId] = React.useState(-1);
	const [vendors, setVendors] = React.useState<SimpleVendor[]>([]);
	const [vendorIndex, setVendorIndex] = React.useState(0);
	const [date, setDate] = React.useState(new Date());
	const [loading, setLoading] = React.useState(false);
	const [reportType, setReportType] = React.useState<ReportType>("pdf");

	const [userInfo] = useAtom(userInfoAtom);

	React.useEffect(() => {
		async function fetchData() {
			setLoading(true);
			const info = await GET<SimpleVendor[]>(`/auth/${userInfo?.role}/vendors?simple=true`, userInfo?.token);
			const newVendors = info.data;

			const newVendorId = vendorId === -1 ? (newVendors.length > 0 ? newVendors[0].id : -1) : vendorId;

			const response = await GET<VendorSales>(
				`/auth/${userInfo?.role}/vendors/${newVendorId}/sales?date=${dayjs(date).format("YYYY-MM-DD")}`,
				userInfo?.token
			);

			const data = response.data;

			setVendors(newVendors);
			setVendorId(newVendorId!);
			setVendorSales({
				sales: data.sales.map((sale) => Big(sale)),
			});

			setLoading(false);
		}

		fetchData();
	}, [userInfo, vendorId, date]);

	return (
		<table
			className="dashboard-sales"
			style={{
				backgroundColor: "lightgray",
				borderRadius: 5,
				padding: 10,
			}}
		>
			<thead>
				<tr>
					<th>
						<select
							value={vendorIndex}
							onChange={(evt) => {
								const index = parseInt(evt.target.value);
								setVendorIndex(index);
								setVendorId(vendors[index].id!);
							}}
						>
							{vendors.map((vendor, i) => (
								<option key={"vendor-option-" + vendor.id} value={i}>
									{vendor.name}
								</option>
							))}
						</select>
					</th>
					<th>Jahr</th>
					<th>Monat</th>
					<th>KW</th>
					<th>Tag</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td style={{ fontWeight: "bold" }}>Zeitraum</td>
					<td style={{ textAlign: "center" }}>
						<YearSelection date={date} setDate={setDate} />
					</td>
					<td style={{ textAlign: "center" }}>
						<MonthSelection date={date} setDate={setDate} />
					</td>
					<td style={{ textAlign: "center" }}>
						<WeekSelection date={date} setDate={setDate} />
					</td>
					<td style={{ textAlign: "center" }}>
						<DateSelection date={date} setDate={setDate} />
					</td>
				</tr>
				<tr>
					<td style={{ fontWeight: "bold" }}>Betrag (Brutto)</td>
					{loading ? (
						<td colSpan={4} style={{ textAlign: "center" }}>
							Laden...
						</td>
					) : (
						vendorSales?.sales.map((amount, i) => (
							<td key={"vendor-sales-" + i} style={{ textAlign: "center" }}>
								{twoDecimalsFormat.format(amount.toNumber())}
							</td>
						))
					)}
				</tr>
				<tr>
					<td>
						<ReportTypeSelection reportType={reportType} setReportType={setReportType} />
					</td>
					{[3, 2, 1, 0].map((invoiceSystem) => (
						<td key={invoiceSystem} style={{ textAlign: "center" }}>
							<ReportButton
								date={date}
								filePrefix={vendors.find((vendor) => vendor.id === vendorId)?.name || ""}
								invoiceSystem={invoiceSystem}
								type={reportType}
								reportsPath={"vendor/" + vendorId}
							/>
						</td>
					))}
				</tr>
			</tbody>
		</table>
	);
}

export default VendorSalesView;
