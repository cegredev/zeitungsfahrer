import { CustomInvoiceText } from "backend/src/models/invoices.model";
import { useAtom } from "jotai";
import React from "react";
import { useImmer } from "use-immer";
import { GET, PUT } from "../../api";
import LoadingPlaceholder from "../../components/util/LoadingPlaceholder";
import { authTokenAtom } from "../../stores/utility.store";

function InvoiceSettings() {
	const [token] = useAtom(authTokenAtom);

	const [customText, setCustomText] = useImmer<CustomInvoiceText | undefined>(undefined);

	React.useEffect(() => {
		async function fetchSettings() {
			const res = await GET<CustomInvoiceText>("/auth/main/documents/templates/invoices", token!);
			setCustomText(res.data);
		}

		fetchSettings();
	}, [token, setCustomText]);

	return (
		<div className="page">
			<h1>Rechnungstext</h1>

			{customText ? (
				<React.Fragment>
					<div
						className="panel"
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
						}}
					>
						<h4>Kontakt:</h4>
						<textarea
							cols={80}
							rows={5}
							value={customText?.contact}
							onChange={(evt) =>
								setCustomText((draft) => {
									draft!.contact = evt.target.value;
								})
							}
							style={{ textAlign: "right" }}
						/>

						<h4>Gruß:</h4>
						<textarea
							cols={80}
							rows={10}
							value={customText?.byeText}
							onChange={(evt) =>
								setCustomText((draft) => {
									draft!.byeText = evt.target.value;
								})
							}
						/>

						<h4>Zahlungsinformationen:</h4>
						<textarea
							cols={80}
							rows={5}
							value={customText?.payment}
							onChange={(evt) =>
								setCustomText((draft) => {
									draft!.payment = evt.target.value;
								})
							}
						/>

						<button
							style={{ marginTop: 20 }}
							onClick={async () => {
								await PUT("/auth/main/documents/templates/invoices", customText, token!);
							}}
						>
							Speichern
						</button>
					</div>
				</React.Fragment>
			) : (
				<LoadingPlaceholder />
			)}
		</div>
	);
}

export default InvoiceSettings;
