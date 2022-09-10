import { Vendor } from "backend/src/models/vendors.model";
import { Link } from "react-router-dom";
import React from "react";
import YesNoPrompt from "./util/YesNoPrompt";
import { useAtom } from "jotai";
import { removeVendorAtom, updateVendorAtom } from "./stores/vendors.store";
import { DELETE, PUT } from "../api";

function VendorItem({ vendor }: { vendor: Vendor }) {
	const [, removeVendor] = useAtom(removeVendorAtom);

	return (
		<div className="vendor-item">
			<h1 style={{ textAlign: "center" }}>{vendor.firstName + " " + vendor.lastName}</h1>

			<hr className="solid-divider" />

			<div style={{ textAlign: "center" }}>
				<div>{vendor.address}</div>
				<div>{vendor.zipCode + " " + vendor.city}</div>

				<hr style={{ marginTop: 10 }} />

				<div>E-Mail: {vendor.email}</div>
				<div>Telefon: {vendor.phone}</div>
			</div>

			<YesNoPrompt
				trigger={<button style={{ color: "red" }}>Löschen</button>}
				header={"Löschen"}
				content={`Wollen Sie das gewählte Element wirklich löschen?`}
				onYes={async () => {
					removeVendor(vendor.id!);
					DELETE("/vendors", { id: vendor.id! });
				}}
			/>
			<Link style={{ float: "right" }} to={"" + vendor.id}>
				Einstellungen
			</Link>
		</div>
	);
}

export default VendorItem;
