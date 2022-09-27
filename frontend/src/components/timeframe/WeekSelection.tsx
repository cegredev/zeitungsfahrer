import dayjs from "dayjs";

interface Props {
	date: Date;
	setDate: (date: Date) => void;
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

function WeekSelection({ date, setDate }: Props) {
	const correctedWeek = getCorrectedWeek(date);

	return (
		<input
			type="number"
			style={{ maxWidth: "3rem" }}
			min={0}
			max={52}
			value={correctedWeek}
			onChange={(evt) => {
				const newWeek = correctWeek(parseInt(evt.target.value) + 1);
				const diff = newWeek - correctedWeek;
				const newDate = dayjs(date)
					.add(diff * 7, "day")
					.toDate();

				setDate(newDate);
			}}
		/>
	);
}

export default WeekSelection;
