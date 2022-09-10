import dayjs from "dayjs";
import React from "react";

import { useParams } from "react-router-dom";
import { GET, PUT } from "../api";
import TimeframeSelection from "../components/TimeframeSelection";
import VendorWeekEntry from "../components/VendorWeekEntry";
import { useAtom } from "jotai";
import { setVendorWeekAtom, vendorWeekAtom } from "../components/stores/vendor.store";
import VendorCatalogSettings from "../components/VendorCatalogSettings";
import { Vendor } from "backend/src/models/vendors.model";
import YesNoPrompt from "../components/util/YesNoPrompt";

const _today = new Date();
const initialEndDate = dayjs(_today)
	.add((7 - _today.getDay()) % 7, "days")
	.toDate();

const labelLeftPadding = { marginLeft: "10px" };

const spanWhole: React.CSSProperties = {
	gridColumn: "span 4",
};

const headerCSS: React.CSSProperties = {
	...spanWhole,
	textAlign: "center",
	margin: 5,
};

function VendorSettings() {
	const params = useParams();

	const [vendor, setVendor] = React.useState<Vendor | null>(null);

	React.useEffect(() => {
		async function fetchData() {
			let data: Vendor | null = null;

			if (params.id === "create") {
				const template = {
					firstName: "",
					lastName: "",
					address: "",
					zipCode: 0,
					city: "",
					email: "",
					phone: "",
					taxId: 0,
					active: true,
				};

				const response = await GET("/vendors/" + params.id + "?catalogOnly=true");
				data = { ...template, catalog: await response.json() };
			} else {
				const response = await GET("/vendors/" + params.id);
				data = await response.json();
			}

			setVendor(data);
		}

		fetchData();
	}, [setVendor, params.id]);

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
								setVendor({ ...vendor, zipCode: parseInt(evt.target.value) });
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
								setVendor({ ...vendor, taxId: parseInt(evt.target.value) });
							}}
						/>

						<div>
							<input
								name="active"
								type="checkbox"
								checked={vendor.active}
								onChange={() => {
									setVendor({ ...vendor, active: !vendor.active });
								}}
							/>
							<label htmlFor="active">Aktiv </label>
						</div>
					</div>

					<YesNoPrompt
						trigger={<button style={{ color: "green", float: "right" }}>Speichern</button>}
						header="Speichern"
						content={`Wollen Sie die Änderungen wirklich speichern?`}
						onYes={async () => {
							console.log(vendor);
							PUT("/vendors", vendor);
						}}
					/>
					<hr className="solid-divider" style={{ marginTop: 30 }} />

					<h3 style={headerCSS}>Artikel</h3>
					<VendorCatalogSettings catalog={vendor.catalog!} />
				</div>
			)}
		</div>
	);
}

export default VendorSettings;
