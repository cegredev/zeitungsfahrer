import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import { dateAsTextWithSystem, twoDecimalsFormat } from "../../consts";
import { authTokenAtom } from "../stores/utility.store";

const today = new Date();

function AllSalesView() {
	const [allSales, setAllSales] = React.useState<number[] | undefined>(undefined);

	const [token] = useAtom(authTokenAtom);

	React.useEffect(() => {
		async function fetchData() {
			const response = await GET("/auth/dashboard/allSales?date=" + dayjs(today).format("YYYY-MM-DD"), token!);
			setAllSales(await response.json());
		}

		fetchData();
	}, [token]);

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
					<th>Gesamte Abrechnung</th>
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
					{allSales?.map((amount, i) => (
						<td key={"all-sales-" + i} style={{ textAlign: "center" }}>
							{twoDecimalsFormat.format(amount)}
						</td>
					))}
				</tr>
			</tbody>
		</table>
	);
}

export default AllSalesView;
