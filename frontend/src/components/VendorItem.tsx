import { Vendor } from "backend/src/models/vendors.model";
import { Link } from "react-router-dom";
import React from "react";
import YesNoPrompt from "./util/YesNoPrompt";
import { useAtom } from "jotai";
import { removeVendorAtom, updateVendorAtom } from "./stores/vendors.store";
import { DELETE, PUT } from "../api";
import { weekdaysShort } from "../consts";

function VendorItem({ v }: { v: Vendor }) {
	const [vendor, setVendor] = React.useState(v);

	const [, updateVendor] = useAtom(updateVendorAtom);
	const [, removeVendor] = useAtom(removeVendorAtom);

	return (
		<div className="vendor-item">
			<input
				style={{ width: "100%" }}
				className="large-input"
				value={vendor.name}
				onChange={(evt) => {
					setVendor({ ...vendor, name: evt.target.value });
				}}
			/>
			<hr className="solid-divider" />
			<div style={{ display: "grid", gridTemplateColumns: "1fr 4fr", paddingLeft: "20px" }}>
				<label htmlFor="address">Adresse:</label>
				<input
					name="address"
					type="text"
					className="vendor-item-input"
					value={vendor.address}
					onChange={(evt) => {
						setVendor({ ...vendor, address: evt.target.value });
					}}
				/>
				<label htmlFor="zipCode">Postleitzahl:</label>
				<input
					name="zipCode"
					type="number"
					className="vendor-item-input"
					value={vendor.zipCode}
					onChange={(evt) => {
						setVendor({ ...vendor, zipCode: parseInt(evt.target.value) });
					}}
				/>
				<label htmlFor="city">Ort:</label>
				<input
					name="city"
					type="text"
					className="vendor-item-input"
					value={vendor.city}
					onChange={(evt) => {
						setVendor({ ...vendor, city: evt.target.value });
					}}
				/>
			</div>
			<hr className="solid-divider" />
			<div>
				<h3 style={{ textAlign: "center", margin: 10 }}>Lieferungen</h3>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(7, 1fr)",
						textAlign: "center",
					}}
				>
					{weekdaysShort.map((name) => (
						<div key={"supplies-day-label-" + name}>{name}</div>
					))}
					{vendor.supplies.map((supply, i) => (
						<div key={"supply-input-" + i} className="centering-div">
							<input
								value={supply.supply}
								style={{ width: "80%" }}
								type="number"
								min={0}
								onChange={(evt) => {
									const supplies = [...vendor.supplies];
									supplies[i] = { ...supplies[i], supply: parseInt(evt.target.value) };
									setVendor({ ...vendor, supplies });
								}}
							/>
						</div>
					))}
				</div>
			</div>
			<hr className="solid-divider" />

			<div style={{ display: "block" }}>
				<Link to={"" + vendor.id}>Details ansehen</Link>
				<div style={{ marginTop: "10px" }}>
					<YesNoPrompt
						trigger={<button style={{ color: "red" }}>Löschen</button>}
						header={"Löschen"}
						content={`Wollen Sie das gewählte Element wirklich löschen?`}
						onYes={async () => {
							removeVendor(vendor.id!);
							DELETE("/vendors", { id: vendor.id! });
						}}
					/>
					<YesNoPrompt
						trigger={<button style={{ color: "green", float: "right" }}>Speichern</button>}
						header={"Speichern"}
						content={`Wollen Sie das gewählte Element wirklich speichern?`}
						onYes={async () => {
							console.log(vendor);
							updateVendor(vendor);
							PUT("/vendors", vendor);
						}}
					/>
				</div>
			</div>
		</div>
	);
}

export default VendorItem;
