import { CustomInvoiceText } from "backend/src/models/invoices.model";
import { useAtom } from "jotai";
import React from "react";
import { useImmer } from "use-immer";
import { GET, PUT } from "../../api";
import LoadingPlaceholder from "../../components/util/LoadingPlaceholder";
import YesNoPrompt from "../../components/util/YesNoPrompt";
import { invoiceSystems } from "../../consts";
import { settingsAtom } from "../../stores/settings.store";
import { authTokenAtom } from "../../stores/utility.store";

function InvoiceSettings() {
	const [token] = useAtom(authTokenAtom);
	const [settings, setSettings] = useAtom(settingsAtom);

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
			<div
				className="panel"
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<h4>Abrechnungsweise</h4>
				<div>
					Abrechnungen werden standardmäßig pro{" "}
					<select
						name="invoiceSystem"
						value={settings?.invoiceSystem}
						onChange={async (evt) => {
							const newSettings = { ...settings!, invoiceSystem: parseInt(evt.target.value) };

							await PUT("/auth/main/settings", newSettings, token!);

							setSettings(newSettings);
						}}
					>
						{invoiceSystems.map((system, i) => (
							<option key={"invoice-option-" + i} value={i}>
								{system}
							</option>
						))}
					</select>{" "}
					generiert.
				</div>

				{customText && (
					<React.Fragment>
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
						/>
						<h4>Gruß:</h4>
						<textarea
							cols={80}
							rows={5}
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
						<YesNoPrompt
							content="Wollen Sie die Rechnungseinstellungen wirklich ändern?"
							header="Rechnungseinstellungen"
							trigger={<button style={{ marginTop: 20 }}>Rechnungstext speichern</button>}
							onYes={async () => {
								await PUT("/auth/main/documents/templates/invoices", customText, token!);
							}}
						/>
					</React.Fragment>
				)}
			</div>
		</div>
	);
}

export default InvoiceSettings;
