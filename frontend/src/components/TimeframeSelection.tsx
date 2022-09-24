import React from "react";
import dayjs from "dayjs";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { months } from "../consts";

interface Props {
	onChange: (date: Date) => void;
	startDate: Date;
}

function correctWeek(week: number): number {
	if (week <= 1) return 52;

	// -1 because the client counts these weeks differently
	return week - 1;
}

function getCorrectedWeek(date: Date): number {
	// Subtract because week counts Sunday as the first day
	return correctWeek(dayjs(date).subtract(1, "day").week());
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

	const correctedWeek = getCorrectedWeek(date);

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
							min={1971}
							value={date.getFullYear()}
							onChange={(evt) => {
								setDate(dayjs(date).set("year", parseInt(evt.target.value)).toDate());
								onChange(date);
							}}
						/>
					</td>

					<td>
						<select
							value={date.getMonth()}
							onChange={(evt) => {
								setDate(dayjs(date).set("month", parseInt(evt.target.value)).toDate());
								onChange(date);
							}}
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
							value={correctedWeek}
							onChange={(evt) => {
								const newWeek = correctWeek(parseInt(evt.target.value) + 1);
								const diff = newWeek - correctedWeek;
								setDate(
									dayjs(date)
										.add(diff * 7, "day")
										.toDate()
								);
								onChange(date);
							}}
						/>
					</td>
					<td>
						<DatePicker
							selected={date}
							showYearDropdown={true}
							dateFormat="dd.MM.yyyy"
							calendarStartDay={1}
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
