import dayjs from "dayjs";

interface Props {
	date: Date;
	setDate: (date: Date) => void;
}

function YearSelection({ date, setDate }: Props) {
	return (
		<input
			type="number"
			style={{ maxWidth: "3rem" }}
			min={1971}
			value={date.getFullYear()}
			onChange={(evt) => {
				const newDate = dayjs(date).set("year", parseInt(evt.target.value)).toDate();
				setDate(newDate);
			}}
		/>
	);
}

export default YearSelection;
