import React from "react";

import "react-datepicker/dist/react-datepicker.css";
import YearSelection from "./YearSelection";
import MonthSelection from "./MonthSelection";
import WeekSelection from "./WeekSelection";
import DateSelection from "./DateSelection";

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
			</tbody>
		</table>
	);
}

export default TimeframeSelection;
