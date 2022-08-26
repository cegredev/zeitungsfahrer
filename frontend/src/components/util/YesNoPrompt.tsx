import Popup from "reactjs-popup";

interface Props {
	trigger: JSX.Element;
	header: string;
	content: string;
	onYes: () => void;
	onNo?: () => void;
}

function YesNoPrompt({ trigger, header, content, onYes, onNo }: Props) {
	return (
		<Popup modal nested trigger={trigger}>
			{/* @ts-ignore */}
			{(close: () => void) => (
				<div className="modal">
					<div className="header" style={{}}>
						{header}
					</div>
					<div className="content">{content}</div>
					<div className="actions">
						<button
							onClick={() => {
								if (onNo) onNo();
								close();
							}}
						>
							Nein
						</button>
						<button
							onClick={() => {
								onYes();
								close();
							}}
						>
							Ja
						</button>
					</div>
				</div>
			)}
		</Popup>
	);
}

export default YesNoPrompt;
