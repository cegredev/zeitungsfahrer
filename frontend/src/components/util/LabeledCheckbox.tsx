import React from "react";

interface Props {
	text: string;
	value: boolean;
	setValue: (value: boolean) => void;
}

function LabeledCheckbox({ text, value, setValue }: Props) {
	return (
		<div>
			<input
				type="checkbox"
				checked={value}
				onChange={() => {
					setValue(!value);
				}}
			/>
			<label
				style={{ userSelect: "none" }}
				onClick={() => {
					setValue(!value);
				}}
			>
				{text}
			</label>
		</div>
	);
}

export default LabeledCheckbox;
