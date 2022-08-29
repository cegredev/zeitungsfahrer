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
						<input
							type="number"
							style={{ maxWidth: "3rem" }}
							min={1970}
							value={date.getFullYear()}
							onChange={(evt) => {
								setDate(dayjs(date).set("year", parseInt(evt.target.value)).toDate());
							}}
						/>
					</td>

					<td>
						<select
							value={date.getMonth()}
							onChange={(evt) => setDate(dayjs(date).set("month", parseInt(evt.target.value)).toDate())}
						>
							{months.map((name, index) => (
								<option key={"month-option-" + index} value={index}>
									{name}
								</option>
							))}
						</select>
					</td>
					<td>
						<input
							type="number"
							style={{ maxWidth: "3rem" }}
							min={0}
							max={54}
							value={dayjs(date).week()}
							onChange={(evt) => {
								const newWeek = parseInt(evt.target.value);
								const diff = newWeek - dayjs(date).week();
								setDate(
									dayjs(date)
										.add(diff * 7, "day")
										.toDate()
								);
							}}
						/>
					</td>
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
