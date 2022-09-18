export function getConvertedWeekday(date: Date): number {
	return (6 + date.getDay()) % 7;
}
