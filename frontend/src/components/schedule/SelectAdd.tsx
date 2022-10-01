import { SimpleVendor } from "backend/src/models/vendors.model";
import React from "react";

interface Props {
	vendors: SimpleVendor[];
	onAdd: (vendor: SimpleVendor) => Promise<void>;
}

function SelectAdd({ vendors, onAdd }: Props) {
	const [selection, setSelection] = React.useState<number | undefined>(vendors[0]?.id);

	return (
		<div style={{ whiteSpace: "nowrap" }}>
			<select
				value={selection}
				onChange={(evt) => {
					setSelection(parseInt(evt.target.value));
				}}
			>
				{vendors.map((vendor, k) => {
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

					await onAdd(vendors.find((v) => v.id === selection)!);
					setSelection(vendors.find((v) => v.id !== selection)?.id);
				}}
			>
				+
			</button>
		</div>
	);
}

export default SelectAdd;
