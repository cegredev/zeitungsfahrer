import React from "react";
import dayjs from "dayjs";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { months } from "../consts";

const startDate = new Date();

interface Props {
	onChange: (date: Date) => void;
}

function TimeframeSelection({ onChange }: Props) {
	const [date, setDate] = React.useState(startDate);

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
					<td>{date.getFullYear()}</td>

					<td>{months[date.getMonth()]} </td>
					<td>{dayjs(date).week()}</td>
					<td>
						<DatePicker
							selected={date}
							showYearDropdown={true}
							dateFormat="dd.MM.yyyy"
							onChange={(date: Date) => {
								setDate(date);
								onChange(date);
							}}
						/>
					</td>
				</tr>
			</tbody>
		</table>
	);
}

export default TimeframeSelection;
