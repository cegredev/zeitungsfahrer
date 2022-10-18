import { Driver } from "backend/src/models/schedule.model";
import { SimpleVendor } from "backend/src/models/vendors.model";
import React from "react";

interface Props {
	drivers: Driver[];
	onAdd: (driver: Driver) => Promise<void>;
}

function SelectAdd({ drivers, onAdd }: Props) {
	const [selection, setSelection] = React.useState<number | undefined>(drivers[0]?.id);

	// console.log("vendors", vendors);

	return (
		<div style={{ whiteSpace: "nowrap" }}>
			<select
				value={selection}
				onChange={(evt) => {
					setSelection(parseInt(evt.target.value));
				}}
			>
				{drivers.map((vendor, k) => {
					return (
						<option value={vendor.id} key={"schedule-vacation-add-" + vendor.id}>
							{vendor.name}
						</option>
					);
				})}
			</select>
			<button
				onClick={async () => {
					if (selection === undefined) return;

					console.log("selection:", selection);

					await onAdd(drivers.find((v) => v.id === selection)!);
					setSelection(drivers.find((v) => v.id !== selection)?.id);
				}}
			>
				+
			</button>
		</div>
	);
}

export default SelectAdd;
