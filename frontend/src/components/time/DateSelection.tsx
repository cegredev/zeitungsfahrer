import DatePicker from "react-datepicker";

interface Props {
	date: Date;
	setDate: (date: Date) => void;
}

function DateSelection({ date, setDate }: Props) {
	return (
		<DatePicker
			selected={date}
			showYearDropdown={true}
			dateFormat="dd.MM.yyyy"
			calendarStartDay={1}
			onChange={(date: Date) => {
				setDate(date);
			}}
		/>
	);
}

export default DateSelection;
