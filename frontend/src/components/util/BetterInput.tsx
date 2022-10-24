import React from "react";

export interface InputProps
	extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
	value?: never;
	defaultValue?: never;
}

export interface BetterInputProps extends InputProps {
	customProps?: {
		startValue: any;
		filter: (input: string, previous: string) => string | void;
	};
}

function BetterInput(props: BetterInputProps) {
	const { startValue, filter } = props.customProps!;

	const [text, setText] = React.useState(String(startValue));

	const inputProps = React.useMemo(() => {
		const inputProps = { ...props };
		delete inputProps.customProps;
		return inputProps;
	}, [props]);

	return (
		<input
			{...inputProps}
			value={text}
			type={props.type || "text"}
			onChange={(evt) => {
				const value = evt.target.value;
				setText(filter(value, text) || value);
			}}
		/>
	);
}

export default BetterInput;
