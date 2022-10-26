import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import { twoDecimalsFormat } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import DateSelection from "../time/DateSelection";
import MonthSelection from "../time/MonthSelection";
import WeekSelection from "../time/WeekSelection";
import YearSelection from "../time/YearSelection";

function AllSalesView() {
	const [allSales, setAllSales] = React.useState<number[] | undefined>(undefined);
	const [date, setDate] = React.useState(new Date());
	const [loading, setLoading] = React.useState(false);

	const [token] = useAtom(authTokenAtom);

	React.useEffect(() => {
		async function fetchData() {
			setLoading(true);

			const response = await GET<number[]>(
				"/auth/dashboard/allSales?date=" + dayjs(date).format("YYYY-MM-DD"),
				token!
			);
			setAllSales(response.data);

			setLoading(false);
		}

		fetchData();
	}, [token, date]);

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
						allSales?.map((amount, i) => (
							<td key={"all-sales-" + i} style={{ textAlign: "center" }}>
								{twoDecimalsFormat.format(amount)}
							</td>
						))
					)}
				</tr>
			</tbody>
		</table>
	);
}

export default AllSalesView;
