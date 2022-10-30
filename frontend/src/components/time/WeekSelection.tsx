import dayjs from "dayjs";
import { normalizeDate } from "../../consts";
import NumberInput from "../util/NumberInput";

interface Props {
	date: Date;
	setDate: (date: Date) => void;
}

function firstWeekStart(year: number): Date {
	let firstWeek = dayjs().set("year", year).set("month", 0).set("date", 1).set("day", 4).toDate();

	if (firstWeek.getFullYear() !== year) {
		firstWeek = dayjs(firstWeek).add(1, "week").toDate();
	}

	return dayjs(normalizeDate(firstWeek)).toDate();
}

function getKW(date: Date): number {
	const firstWeek = firstWeekStart(date.getFullYear());

	date = dayjs(normalizeDate(date)).set("day", 4).toDate();

	return dayjs(date).diff(firstWeek, "weeks") + 1;
}

function WeekSelection({ date, setDate }: Props) {
	return (
		<NumberInput
			style={{ maxWidth: "3rem" }}
			min={0}
			customProps={{
				parse: parseInt,
				startValue: getKW(date),
				filter: (value) => {
					let newDate = dayjs(firstWeekStart(date.getFullYear()))
						.add(value - 1, "weeks")
						.toDate();

					if (newDate.getFullYear() > date.getFullYear())
						newDate = dayjs(firstWeekStart(date.getFullYear() + 1)).toDate();

					setDate(dayjs(newDate).set("day", 1).toDate());

					return String(getKW(newDate));
				},
			}}
		/>
	);
}

export default WeekSelection;
