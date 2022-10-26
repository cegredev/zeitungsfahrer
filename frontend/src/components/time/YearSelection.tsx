import dayjs from "dayjs";
import NumberInput from "../util/NumberInput";

interface Props {
	date: Date;
	setDate: (date: Date) => void;
}

function YearSelection({ date, setDate }: Props) {
	return (
		<NumberInput
			style={{ maxWidth: "3rem" }}
			min={1971}
			customProps={{
				parse: parseInt,
				startValue: date.getFullYear(),
				filter: (value) => {
					const newDate = dayjs(date).set("year", value).toDate();
					setDate(newDate);
				},
			}}
		/>
	);
}

export default YearSelection;
