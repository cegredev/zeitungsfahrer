import React from "react";

import "react-datepicker/dist/react-datepicker.css";
import YearSelection from "./timeframe/YearSelection";
import MonthSelection from "./timeframe/MonthSelection";
import WeekSelection from "./timeframe/WeekSelection";
import DateSelection from "./timeframe/DateSelection";

interface Props {
	onChange: (date: Date) => void;
	startDate: Date;
}

function TimeframeSelection({ onChange, startDate }: Props) {
	const [date, _setDate] = React.useState(startDate);

	const setDate = React.useCallback(
		(date: Date) => {
			_setDate(date);
			onChange(date);
		},
		[onChange]
	);

	return (
		<table className="timeframe-selection" style={{ zIndex: 2, position: "sticky", top: 50 }}>
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
			</tbody>
		</table>
	);
}

export default TimeframeSelection;
