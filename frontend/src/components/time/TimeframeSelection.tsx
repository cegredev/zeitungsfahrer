import React from "react";

import "react-datepicker/dist/react-datepicker.css";
import YearSelection from "./YearSelection";
import MonthSelection from "./MonthSelection";
import WeekSelection from "./WeekSelection";
import DateSelection from "./DateSelection";
import ReportButton from "../dashboard/ReportButton";
import { ReportType } from "backend/src/models/reports.model";
import InvoiceButton from "../InvoiceButton";

interface Props {
	onChange: (date: Date) => void;
	startDate: Date;
	vendor: { id: number; name: string };
	reportType: ReportType;
}

function TimeframeSelection({ onChange, startDate, vendor, reportType }: Props) {
	const [date, _setDate] = React.useState(startDate);

	const setDate = React.useCallback(
		(date: Date) => {
			_setDate(date);
			onChange(date);
		},
		[onChange]
	);

	return (
		<table className="timeframe-selection">
			<thead>
				<tr>
					<th>Jahr</th>
					<th>Monat</th>
					<th>KW</th>
					<th>Datum</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>
						<YearSelection date={date} setDate={setDate} />
					</td>

					<td>
						<MonthSelection date={date} setDate={setDate} />
					</td>
					<td>
						<WeekSelection date={date} setDate={setDate} />
					</td>
					<td>
						<DateSelection date={date} setDate={setDate} />
					</td>
				</tr>
				<tr>
					{[3, 2, 1, 0].map((invoiceSystem) => (
						<td key={invoiceSystem} style={{ textAlign: "center" }}>
							<ReportButton
								date={date}
								filePrefix={vendor.name}
								invoiceSystem={invoiceSystem}
								type={reportType}
								reportsPath={"vendor/" + vendor.id}
							/>
						</td>
					))}
				</tr>
				<tr>
					{[3, 2, 1, 0].map((invoiceSystem) => (
						<td key={invoiceSystem} style={{ textAlign: "center" }}>
							<InvoiceButton date={date} vendor={vendor} system={invoiceSystem} />
						</td>
					))}
				</tr>
			</tbody>
		</table>
	);
}

export default TimeframeSelection;
