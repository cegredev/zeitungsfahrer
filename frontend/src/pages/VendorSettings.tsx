import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DELETE, GET, POST, PUT } from "../api";
import { useAtom } from "jotai";
import VendorCatalogSettings from "../components/VendorCatalogSettings";
import { Vendor, VendorCatalog } from "backend/src/models/vendors.model";
import YesNoPrompt from "../components/util/YesNoPrompt";
import LabeledCheckbox from "../components/util/LabeledCheckbox";
import { popupMessageAtom, userInfoAtom } from "../stores/utility.store";
import NumberInput from "../components/util/NumberInput";
import axios from "axios";
import BetterInput from "../components/util/BetterInput";
import ResetPasswordPopup from "../components/ResetPasswordPopup";

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

	const [id, setId] = React.useState(useParams().id!);
	const isDraft = id === "create";

	const [vendor, setVendor] = React.useState<Vendor | null>(null);

	const [, setPopupMessage] = useAtom(popupMessageAtom);

	const [userInfo] = useAtom(userInfoAtom);

	React.useEffect(() => {
		async function fetchData() {
			let data: Vendor | null = null;

			if (isDraft) {
				const template = {
					firstName: "",
					lastName: "",
					address: "",
					zipCode: 5000,
					city: "",
					email: "",
					phone: "",
					taxId: "",
					customId: 123 + Math.floor(Math.random() * 100000),
					active: true,
				};

				const response = await GET<VendorCatalog>(
					"/auth/main/vendors/" + id + "?mode=catalog",
					userInfo!.token
				);
				data = { ...template, catalog: response.data };
			} else {
				const response = await GET<Vendor>("/auth/main/vendors/" + id + "?mode=full", userInfo!.token);
				data = response.data;
			}

			setVendor(data);
		}

		fetchData();
	}, [setVendor, isDraft, id, userInfo]);

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
						<NumberInput
							name="zipCode"
							customProps={{
								parse: parseInt,
								startValue: vendor.zipCode,
								filter: (value) => {
									setVendor({ ...vendor, zipCode: value });
								},
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
							type="email"
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
						<BetterInput
							name="taxId"
							customProps={{
								filter(input, previous) {
									if (input.match(/[^0-9/]/)) {
										return previous;
									}

									setVendor({ ...vendor, taxId: input });
								},
								startValue: vendor.taxId,
							}}
						/>

						{!isDraft && (
							<>
								<LabeledCheckbox
									text="Aktiv"
									value={vendor.active}
									setValue={() => {
										setVendor({ ...vendor, active: !vendor.active });
									}}
								/>
								<div />
							</>
						)}

						<label htmlFor="customId">Kundennr.:</label>
						<NumberInput
							name="customId"
							customProps={{
								parse: parseInt,
								startValue: vendor.customId,
								filter: (value) => {
									setVendor({ ...vendor, customId: value });
								},
							}}
						/>

						{!isDraft && (
							<>
								{" "}
								<label>Passwort:</label>
								<ResetPasswordPopup username={"vendor:" + vendor.id!} />
							</>
						)}
					</div>

					<YesNoPrompt
						trigger={<button style={{ color: "green", float: "right", margin: 10 }}>Speichern</button>}
						header="Speichern"
						content={`Wollen Sie die ??nderungen wirklich speichern?`}
						onYes={async () => {
							if (
								[
									vendor.firstName,
									vendor.lastName,
									vendor.address,
									vendor.zipCode,
									vendor.city,
									vendor.customId,
								]
									.map((val) => String(val).length)
									.some((length) => length === 0)
							) {
								setPopupMessage({
									type: "error",
									content: "Bitte f??llen Sie alle Felder aus.",
								});
								return;
							}

							try {
								if (isDraft) {
									const response = await POST<{ id: number; password: string }>(
										"/auth/main/vendors",
										vendor,
										userInfo!.token
									);

									const data = response.data;
									setId(String(data.id));
									setVendor({ ...vendor, id: data.id });
									navigate(`/vendors/${data.id}`);

									setPopupMessage({
										type: "info",
										content: "Das Passwort f??r diesen H??ndler ist: " + data.password,
									});
								} else {
									await PUT("/auth/main/vendors", vendor, userInfo!.token);
								}
							} catch (e) {
								if (axios.isAxiosError(e)) {
									setPopupMessage(e.response?.data.userMessage);
								}
							}
						}}
					/>
					{!isDraft && (
						<React.Fragment>
							<hr className="solid-divider" style={{ marginTop: 30 }} />
							<h3 style={headerCSS}>Artikel</h3>
							<VendorCatalogSettings vendorId={vendor.id!} catalog={vendor.catalog!} />

							<hr className="solid-divider" style={{ marginTop: 30 }} />

							<div style={{ ...spanWhole, textAlign: "center", marginTop: 25 }}>
								<YesNoPrompt
									trigger={
										<button style={{ color: "red", fontSize: "medium" }}>H??ndler l??schen</button>
									}
									header={"L??schen"}
									content={`Wollen Sie den H??ndler "${
										vendor.firstName + " " + vendor.lastName
									}" wirklich l??schen? Alternativ k??nnen Sie ihn auch nur auf inaktiv setzen!`}
									onYes={async () => {
										await DELETE("/auth/main/vendors/" + vendor.id!, userInfo!.token);
										navigate("/vendors");
									}}
								/>
							</div>
						</React.Fragment>
					)}
				</div>
			)}
		</div>
	);
}

export default VendorSettings;
