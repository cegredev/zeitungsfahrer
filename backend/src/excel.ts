import ExcelJS from "exceljs";
import { ReportDoc } from "./models/reports.model";

export const boldRow = (row: number, doc: ReportDoc, sheet: ExcelJS.Worksheet) => {
	for (let column = 1; column <= doc.columns.length; column++) {
		const cell = sheet.getCell(row, column);
		cell.style = {
			...cell.style,
			font: {
				...cell.style.font,
				bold: true,
			},
		};
	}
};
