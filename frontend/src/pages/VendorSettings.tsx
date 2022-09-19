import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DELETE, GET, POST, PUT } from "../api";
import { useAtom } from "jotai";
import VendorCatalogSettings from "../components/VendorCatalogSettings";
import { Vendor } from "backend/src/models/vendors.model";
import YesNoPrompt from "../components/util/YesNoPrompt";
import LabeledCheckbox from "../components/util/LabeledCheckbox";
import { removeVendorAtom } from "../components/stores/vendors.store";
import { authTokenAtom, errorMessageAtom } from "../components/stores/utility.store";

const spanWhole: React.CSSProperties = {
	gridColumn: "span 4",
};

const headerCSS: React.CSSProperties = {
	...spanWhole,
	textAlign: "center",
	margin: 5,
};

function VendorSettings() {
	const navigate = useNavigate();

	const id = useParams().id!;
	const isDraft = id === "create";

	const [vendor, setVendor] = React.useState<Vendor | null>(null);
	const [, removeVendor] = useAtom(removeVendorAtom);

	const [, setErrorMessage] = useAtom(errorMessageAtom);

	const [token] = useAtom(authTokenAtom);

	React.useEffect(() => {
		async function fetchData() {
			let data: Vendor | null = null;

			if (isDraft) {
				const template = {
					firstName: "",
					lastName: "",
					address: "",
					zipCode: "",
					city: "",
					email: "",
					phone: "",
					taxId: "",
					lastRecordEntry: new Date("1970-01-01"),
					active: true,
				};

				const response = await GET("/auth/vendors/" + id + "?catalogOnly=true", token!);
				data = { ...template, catalog: await response.json() };
			} else {
				const response = await GET("/auth/vendors/" + id, token!);
				data = await response.json();
			}

			setVendor(data);
		}

		fetchData();
	}, [setVendor, isDraft, id, token]);

	return (
		<div className="page vendor-settings" style={{ padding: 20 }}>
			{vendor != null && (
				<div style={{ padding: 30, backgroundColor: "lightgray", borderRadius: 10 }}>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr 1fr 2.5fr", gap: 5 }}>
						<h3 style={headerCSS}>Adresse</h3>
						<label htmlFor="firstName">Vorname:</label>
						<input
							name="firstName"
							type="text"
							value={vendor.firstName}
							onChange={(evt) => {
								setVendor({ ...vendor, firstName: evt.target.value });
							}}
						/>
						<label htmlFor="lastName">Nachname:</label>
						<input
							name="firstName"
							type="text"
							value={vendor.lastName}
							onChange={(evt) => {
								setVendor({ ...vendor, lastName: evt.target.value });
							}}
						/>
						<label htmlFor="address">Adresse:</label>
						<input
							name="address"
							type="text"
							value={vendor.address}
							onChange={(evt) => {
								setVendor({ ...vendor, address: evt.target.value });
							}}
						/>
						<div />
						<div />
						<label htmlFor="zipCode">Postleitzahl:</label>
						<input
							name="zipCode"
							type="number"
							value={vendor.zipCode}
							onChange={(evt) => {
								setVendor({ ...vendor, zipCode: evt.target.value });
							}}
						/>
						<label htmlFor="city">Ort:</label>
						<input
							name="city"
							type="text"
							value={vendor.city}
							onChange={(evt) => {
								setVendor({ ...vendor, city: evt.target.value });
							}}
						/>
						<hr className="solid-divider" style={spanWhole} />

						<h3 style={headerCSS}>Kontakt</h3>

						<label htmlFor="email">Email: </label>
						<input
							name="email"
							type="text"
							value={vendor.email}
							onChange={(evt) => {
								setVendor({ ...vendor, email: evt.target.value });
							}}
						/>
						<label htmlFor="phone">Telefon: </label>
						<input
							name="phone"
							type="text"
							value={vendor.phone}
							onChange={(evt) => {
								setVendor({ ...vendor, phone: evt.target.value });
							}}
						/>

						<hr className="solid-divider" style={spanWhole} />

						<h3 style={headerCSS}>Sonstiges</h3>

						<label htmlFor="taxId">Steuernr.:</label>
						<input
							name="taxId"
							type="number"
							value={vendor.taxId}
							onChange={(evt) => {
								setVendor({ ...vendor, taxId: evt.target.value });
							}}
						/>

						{!isDraft && (
							<LabeledCheckbox
								text="Aktiv"
								value={vendor.active}
								setValue={() => {
									setVendor({ ...vendor, active: !vendor.active });
								}}
							/>
						)}
					</div>

					<YesNoPrompt
						trigger={<button style={{ color: "green", float: "right" }}>Speichern</button>}
						header="Speichern"
						content={`Wollen Sie die Änderungen wirklich speichern?`}
						onYes={async () => {
							if (isDraft) {
								const response = await POST("/auth/vendors", vendor, token!);
								const data = await response.json();
								navigate(`/vendors/${data.id}`);
								navigate(0);
							} else {
								await PUT("/auth/vendors", vendor, token!);
							}
						}}
					/>
					{!isDraft && (
						<React.Fragment>
							<hr className="solid-divider" style={{ marginTop: 30 }} />
							<h3 style={headerCSS}>Artikel</h3>
							<VendorCatalogSettings catalog={vendor.catalog!} />
						</React.Fragment>
					)}

					<hr className="solid-divider" style={{ marginTop: 30 }} />

					<div style={{ ...spanWhole, textAlign: "center", marginTop: 25 }}>
						<YesNoPrompt
							trigger={<button style={{ color: "red", fontSize: "medium" }}>Händler löschen</button>}
							header={"Löschen"}
							content={`Wollen Sie den Händler "${
								vendor.firstName + " " + vendor.lastName
							}" wirklich löschen? Alternativ können Sie ihn auch nur auf inaktiv setzen!`}
							onYes={async () => {
								console.log(Object.values(vendor).map((val) => String(val)));

								if (
									Object.values(vendor)
										.map((val) => String(val).length)
										.some((length) => length === 0)
								) {
									setErrorMessage("Bitte füllen Sie alle Felder aus.");
									return;
								}

								await DELETE("/auth/vendors", { id: vendor.id! }, token!);
								removeVendor(vendor.id!);
								navigate("/vendors");
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

export default VendorSettings;
