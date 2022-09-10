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
		<div className="page" style={{ padding: 20 }}>
			{vendor != null && (
				<div style={{ padding: 30, backgroundColor: "lightgray", borderRadius: 10 }}>
					<div style={{ textAlign: "center", fontWeight: "bold" }}>Adresse</div>
					<div>
						<label htmlFor="firstName">Vorname: </label>
						<input
							name="firstName"
							type="text"
							value={vendor.firstName}
							onChange={(evt) => {
								setVendor({ ...vendor, firstName: evt.target.value });
							}}
						/>
						<label htmlFor="lastName" style={labelLeftPadding}>
							{" "}
							Nachname:{" "}
						</label>
						<input
							name="firstName"
							type="text"
							value={vendor.lastName}
							onChange={(evt) => {
								setVendor({ ...vendor, lastName: evt.target.value });
							}}
						/>
					</div>

					<div>
						<label htmlFor="address">Adresse: </label>
						<input
							name="address"
							type="text"
							value={vendor.address}
							onChange={(evt) => {
								setVendor({ ...vendor, address: evt.target.value });
							}}
						/>
					</div>

					<div>
						<label htmlFor="zipCode">Postleitzahl: </label>
						<input
							name="zipCode"
							type="number"
							value={vendor.zipCode}
							onChange={(evt) => {
								setVendor({ ...vendor, zipCode: parseInt(evt.target.value) });
							}}
						/>
						<label htmlFor="city" style={labelLeftPadding}>
							Ort:{" "}
						</label>
						<input
							name="city"
							type="text"
							value={vendor.city}
							onChange={(evt) => {
								setVendor({ ...vendor, city: evt.target.value });
							}}
						/>
					</div>

					<hr className="solid-divider" />

					<div style={{ textAlign: "center", fontWeight: "bold" }}>Kontakt</div>
					<div>
						<label htmlFor="email">Email: </label>
						<input
							name="email"
							type="text"
							value={vendor.email}
							onChange={(evt) => {
								setVendor({ ...vendor, email: evt.target.value });
							}}
						/>
					</div>
					<div>
						<label htmlFor="phone">Telefon: </label>
						<input
							name="phone"
							type="text"
							value={vendor.phone}
							onChange={(evt) => {
								setVendor({ ...vendor, phone: evt.target.value });
							}}
						/>
					</div>

					<hr className="solid-divider" />

					<div style={{ textAlign: "center", fontWeight: "bold" }}>Sonstiges</div>
					<div>
						<label htmlFor="taxId">Steuernummer: </label>
						<input
							name="taxId"
							type="number"
							value={vendor.taxId}
							onChange={(evt) => {
								setVendor({ ...vendor, taxId: parseInt(evt.target.value) });
							}}
						/>
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

					<div style={{ textAlign: "center", fontWeight: "bold" }}>Artikel</div>
					<VendorCatalogSettings catalog={vendor.catalog!} />
				</div>
			)}
		</div>
	);
}

export default VendorSettings;
