import React from "react";
import BetterInput, { InputProps } from "./BetterInput";

interface Props extends InputProps {
	customProps: {
		parse: (input: string) => number;
		filter: (input: number, previous: number) => string | void;
		startValue?: number;
		allowDecimals?: boolean;
	};
}

function NumberInput(props: Props) {
	const { parse, startValue, filter, allowDecimals } = props.customProps;

	const regex = React.useMemo(() => (allowDecimals ? /^([0-9]|\.)+$/ : /^([0-9])+$/), [allowDecimals]);

	return (
		<BetterInput
			{...props}
			type="number"
			customProps={{
				startValue,
				filter: (input, previous) => {
					if (input === "") return input;
					if (input.match(regex) === null) return previous;

					const out = filter(parse(input), parse(previous));
					if (out) return String(out);
				},
			}}
		/>
	);
}

export default NumberInput;
