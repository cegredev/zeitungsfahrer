import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET_BLOB } from "../../api";
import { months } from "../../consts";
import { downloadUrl } from "../../files";
import { authTokenAtom } from "../../stores/utility.store";
import { getKW } from "../time/WeekSelection";
import { ReportType } from "backend/src/models/reports.model";

interface Props {
	invoiceSystem: number;
	type: ReportType;
	filePrefix: string;
	reportsPath: string;
	date: Date;
}

function ReportButton({ invoiceSystem, type, filePrefix, reportsPath, date }: Props) {
	const [token] = useAtom(authTokenAtom);

	return (
		<button
			onClick={async () => {
				const report = await GET_BLOB(
					`/auth/reports/${reportsPath}?date=${dayjs(date).format(
						"YYYY-MM-DD"
					)}&invoiceSystem=${invoiceSystem}&type=${type}`,
					token!
				);

				let fileName = filePrefix + " ";

				switch (invoiceSystem) {
					case 0:
						fileName += dayjs(date).format("YYYY-MM-DD");
						break;
					case 1:
						fileName += "KW " + getKW(date);
						break;
					case 2:
						fileName += months[date.getMonth()];
						break;
					case 3:
						fileName += date.getFullYear();
						break;
				}

				const fileUrl = URL.createObjectURL(report.data);

				if (type === "excel") {
					downloadUrl(fileUrl, fileName + ".xlsx");
				} else {
					const w = window.open(fileUrl, "_blank");
					if (w) {
						w.document.write(
							"<html><head><title>" +
								fileName +
								"</title></head><body>" +
								'<embed width="100%" height="100%" name="plugin" src="' +
								fileUrl +
								'" ' +
								'type="application/pdf" internalinstanceid="21"></body></html>'
						);
						w.focus();
					}

					setTimeout(() => downloadUrl(fileUrl, fileName + ".pdf"), 1000);
				}
			}}
		>
			Bericht
		</button>
	);
}

export default ReportButton;
