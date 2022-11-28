import { ReportType } from "backend/src/models/reports.model";
import React from "react";
import WeekSelection from "../time/WeekSelection";
import ReportButton from "./ReportButton";
import ReportTypeSelection from "./ReportTypeSelection";

const today = new Date();

function WeeklyBillView() {
	const [reportType, setReportType] = React.useState<ReportType>("pdf");
	const [date, setDate] = React.useState(today);

	return (
		<div className="panel" style={{ display: "flex", flexDirection: "row", gap: 10, justifyContent: "center" }}>
			<div style={{ fontWeight: "bold" }}>
				Alle Händler für KW <WeekSelection date={date} setDate={setDate} /> abrechnen:
			</div>
			<ReportTypeSelection reportType={reportType} setReportType={setReportType} />
			<ReportButton
				date={date}
				filePrefix={"Abrechnung"}
				invoiceSystem={1}
				reportsPath={"weeklyBIll"}
				type={reportType}
			/>
		</div>
	);
}

export default WeeklyBillView;
