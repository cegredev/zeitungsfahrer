import { ArticleInfo } from "backend/src/models/articles.model";
import { ArticleSales, VendorSales } from "backend/src/models/records.model";
import { Vendor } from "backend/src/models/vendors.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import { dateAsTextWithSystem, invoiceSystems, normalizeDate, twoDecimalsFormat } from "../../consts";
import { authTokenAtom } from "../stores/utility.store";

function VendorSalesView() {
	const [vendorSales, setVendorSales] = React.useState<VendorSales | undefined>(undefined);
	const [vendorId, setVendorId] = React.useState(1);
	const [vendors, setVendors] = React.useState<Vendor[]>([]);
	const [vendorIndex, setVendorIndex] = React.useState(0);

	const [token] = useAtom(authTokenAtom);

	const today = new Date();

	React.useEffect(() => {
		async function fetchData() {
			const response = await GET(
				"/auth/vendors/" + vendorId + "/sales?date=" + dayjs(today).format("YYYY-MM-DD"),
				token!
			);
			setVendorSales(await response.json());

			const info = await GET("/auth/vendors", token!);
			setVendors(await info.json());
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
					{vendorSales?.sales.map((amount) => (
						<td style={{ textAlign: "center" }}>{twoDecimalsFormat.format(amount)}</td>
					))}
				</tr>
			</tbody>
		</table>
	);
}

export default VendorSalesView;
