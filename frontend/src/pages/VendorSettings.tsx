import dayjs from "dayjs";
import React from "react";

import { useParams } from "react-router-dom";
import { GET, PUT } from "../api";
import TimeframeSelection from "../components/TimeframeSelection";
import VendorWeekEntry from "../components/VendorWeekEntry";
import { useAtom } from "jotai";
import { setVendorWeekAtom, vendorWeekAtom } from "../components/stores/vendor.store";
import VendorSettingsArticles from "../components/VendorSettingsArticles";

const _today = new Date();
const initialEndDate = dayjs(_today)
	.add((7 - _today.getDay()) % 7, "days")
	.toDate();

const labelLeftPadding = { marginLeft: "10px" };

function VendorSettings() {
	const params = useParams();
	const isDraft = params.id === "create";

	const [vendor, setVendor]: [any, React.Dispatch<React.SetStateAction<any>>] = React.useState(
		isDraft
			? {
					firstName: "Neuer",
					lastName: "Händler",
			  }
			: undefined
	);

	// const [vendorWeek] = useAtom(vendorWeekAtom);
	// const [, setVendorWeek] = useAtom(setVendorWeekAtom);

	// const fetchData = React.useCallback(
	// 	async (end: Date): Promise<void> => {
	// 		const response = await GET(`/vendors/${vendorId}?end=${dayjs(end).format("YYYY-MM-DD")}`);
	// 		const data = await response.json();

	// 		setVendorWeek(data);
	// 	},
	// 	[vendorId, setVendorWeek]
	// );

	// React.useEffect(() => {
	// 	fetchData(initialEndDate);
	// }, [fetchData]);

	return (
		<div className="page" style={{ padding: 20 }}>
			<div style={{ padding: 30, backgroundColor: "lightgray", borderRadius: 10 }}>
				<div style={{ textAlign: "center", fontWeight: "bold" }}>Adresse</div>
				<div>
					<label htmlFor="firstName">Vorname: </label>
					<input
						name="firstName"
						type="text"
						value={vendor?.firstName || ""}
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
						value={vendor?.lastName || ""}
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
						value={vendor?.address || ""}
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
						value={vendor?.zipCode || 1234}
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
						value={vendor?.city || ""}
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
						value={vendor?.email || ""}
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
						value={vendor?.phone || ""}
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
						type="text"
						value={vendor?.taxId || ""}
						onChange={(evt) => {
							setVendor({ ...vendor, taxId: evt.target.value });
						}}
					/>
				</div>

				<hr className="solid-divider" />

				<div style={{ textAlign: "center", fontWeight: "bold" }}>Artikel</div>
				<VendorSettingsArticles />
			</div>

			{/* {vendorWeek == null ? (
				"Laden..."
			) : (
				<React.Fragment>
					<input
						className="large-input"
						value={vendorWeek.name}
						onChange={(evt) => {
							setVendorWeek({ ...vendorWeek, name: evt.target.value });
						}}
						onBlur={() => {
							PUT("/vendors", { id: vendorId, name: vendorWeek.name });
						}}
					/>
					<TimeframeSelection onChange={fetchData} startDate={initialEndDate} />
					{vendorWeek.articleWeeks.map((articleWeek) => (
						<VendorWeekEntry
							key={"vendor-week-" + vendorId + "-" + articleWeek.id + "-" + articleWeek.start}
							vendorId={vendorId}
							articleWeek={articleWeek}
						/>
					))}
				</React.Fragment>
			)} */}
		</div>
	);
}

export default VendorSettings;
