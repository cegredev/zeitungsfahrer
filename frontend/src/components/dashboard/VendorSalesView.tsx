import { VendorSales } from "backend/src/models/records.model";
import { Vendor } from "backend/src/models/vendors.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import { dateAsTextWithSystem, twoDecimalsFormat } from "../../consts";
import { authTokenAtom } from "../stores/utility.store";

const today = new Date();

function VendorSalesView() {
	const [vendorSales, setVendorSales] = React.useState<VendorSales | undefined>(undefined);
	const [vendorId, setVendorId] = React.useState(-1);
	const [vendors, setVendors] = React.useState<Vendor[]>([]);
	const [vendorIndex, setVendorIndex] = React.useState(0);

	const [token] = useAtom(authTokenAtom);

	React.useEffect(() => {
		async function fetchData() {
			const info = await GET("/auth/vendors", token!);
			const newVendors = await info.json();
			setVendors(newVendors);

			const newVendorId = vendorId === -1 ? (newVendors.length > 0 ? newVendors[0].id : -1) : vendorId;
			setVendorId(newVendorId);

			const response = await GET(
				"/auth/vendors/" + newVendorId + "/sales?date=" + dayjs(today).format("YYYY-MM-DD"),
				token!
			);
			setVendorSales(await response.json());
		}

		fetchData();
	}, [token, vendorId]);

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
									{vendor.firstName + " " + vendor.lastName}
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
					<td style={{ textAlign: "center" }}>{dateAsTextWithSystem(today, 3)}</td>
					<td style={{ textAlign: "center" }}>{dateAsTextWithSystem(today, 2)}</td>
					<td style={{ textAlign: "center" }}>{dateAsTextWithSystem(today, 1)}</td>
					<td style={{ textAlign: "center" }}>{dateAsTextWithSystem(today, 0)}</td>
				</tr>
				<tr>
					<td style={{ fontWeight: "bold" }}>Betrag (Brutto)</td>
					{vendorSales?.sales.map((amount, i) => (
						<td key={"vendor-sales-" + i} style={{ textAlign: "center" }}>
							{twoDecimalsFormat.format(amount)}
						</td>
					))}
				</tr>
			</tbody>
		</table>
	);
}

export default VendorSalesView;
