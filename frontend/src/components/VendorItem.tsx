import { Vendor } from "backend/src/models/vendors.model";
import { Link } from "react-router-dom";

function VendorItem({ vendor }: { vendor: Vendor }) {
	return (
		<div className="vendor-item">
			<h1 style={{ textAlign: "center", margin: 5 }}>{vendor.firstName + " " + vendor.lastName}</h1>
			<h5
				style={{ fontWeight: "normal", textAlign: "center", margin: 0, color: vendor.active ? "green" : "red" }}
			>
				{vendor.active ? "Aktiv" : "Inaktiv"}
			</h5>

			<hr className="solid-divider" />

			<div style={{ textAlign: "center" }}>
				<div>{vendor.address}</div>
				<div>{vendor.zipCode + " " + vendor.city}</div>

				<hr style={{ marginTop: 10 }} />

				<div>E-Mail: {vendor.email}</div>
				<div>Telefon: {vendor.phone}</div>
			</div>

			<div>
				<Link style={{ float: "left" }} to={"" + vendor.id}>
					Einstellungen
				</Link>

				<Link style={{ float: "right" }} to={"/invoices/" + vendor.id}>
					Rechnungen
				</Link>
			</div>
		</div>
	);
}

export default VendorItem;
