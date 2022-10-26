import dayjs from "dayjs";
import { months } from "../../consts";

interface Props {
	date: Date;
	setDate: (date: Date) => void;
}

function MonthSelection({ date, setDate }: Props) {
	return (
		<select
			value={date.getMonth()}
			onChange={(evt) => {
				const newDate = dayjs(date).set("month", parseInt(evt.target.value)).toDate();
				setDate(newDate);
			}}
		>
			{months.map((name, index) => (
				<option key={"month-option-" + index} value={index}>
					{name}
				</option>
			))}
		</select>
	);
}

export default MonthSelection;
