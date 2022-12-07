import dayjs from "dayjs";
import { useAtom } from "jotai";
import { SimpleVendor } from "backend/src/models/vendors.model";
import { authTokenAtom } from "../stores/utility.store";
import { GET_BLOB, POST_BLOB } from "../api";
import { getKW } from "./time/WeekSelection";
import { months, openAndDownloadFile } from "../consts";
import { downloadUrl } from "../files";

interface Props {
	system: number;
	date: Date;
	vendor: { id: number; name: string };
}

function InvoiceButton({ system, vendor, date }: Props) {
	const [token] = useAtom(authTokenAtom);

	return (
		<button
			onClick={async () => {
				const report = await POST_BLOB(
					`/auth/main/invoices/${vendor.id}?date=${dayjs(date).format("YYYY-MM-DD")}&system=${system}`,
					token!
				);

				let fileName = vendor.name + " ";

				switch (system) {
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

				openAndDownloadFile(fileName, ".pdf", URL.createObjectURL(report.data));
			}}
		>
			Rechnung
		</button>
	);
}

export default InvoiceButton;
