import { ReportType } from "backend/src/models/reports.model";
import React from "react";

interface Props {
	reportType: ReportType;
	setReportType: (type: ReportType) => void;
}

function ReportTypeSelection({ reportType, setReportType }: Props) {
	return (
		<select
			value={reportType}
			onChange={(evt) => {
				// @ts-ignore
				setReportType(evt.target.value);
			}}
		>
			<option value="pdf">PDF</option>
			<option value="excel">Excel</option>
		</select>
	);
}

export default ReportTypeSelection;
