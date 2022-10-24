import React from "react";
import BetterInput, { InputProps } from "./BetterInput";

interface Props extends InputProps {
	customProps: { filter: (input: number, previous: string) => string | void; startValue?: number };
}

function IntInput(props: Props) {
	const { startValue, filter } = props.customProps;

	return (
		<BetterInput
			{...props}
			type="number"
			customProps={{
				startValue,
				filter: (input, previous) => {
					if (input === "") return input;
					if (input.match(/^([0-9])+$/) === null) return previous;

					const out = filter(parseInt(input), previous);
					if (out) return String(out);
				},
			}}
		/>
	);
}

export default IntInput;
