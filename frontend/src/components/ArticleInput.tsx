import React from "react";

interface Props {
	type: React.HTMLInputTypeAttribute;
	style?: React.CSSProperties;
	defaultValue: any;
	step?: number;
	onChange: (evt: React.ChangeEvent<HTMLInputElement>) => void;
}

function ArticleInput(props: Props) {
	return (
		<input
			type={props.type}
			className="article-input"
			defaultValue={props.defaultValue}
			step={props.step}
			onChange={props.onChange}
			style={props.style}
		/>
	);
}

export default ArticleInput;
