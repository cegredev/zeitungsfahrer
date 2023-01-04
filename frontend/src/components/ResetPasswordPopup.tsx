import { useAtom } from "jotai";
import React from "react";
import { POST } from "../api";
import { generatePassword } from "../consts";
import { popupMessageAtom, userInfoAtom } from "../stores/utility.store";
import YesNoPrompt from "./util/YesNoPrompt";

interface Props {
	username: string;
}

function ResetPasswordPopup({ username }: Props) {
	const [userInfo] = useAtom(userInfoAtom);
	const [, setPopupMessage] = useAtom(popupMessageAtom);

	return (
		<YesNoPrompt
			content="Wollen Sie das Passwort wirklich zurücksetzen?"
			header="Passwort zurücksetzen"
			trigger={<label className="download-link">Zurücksetzen</label>}
			onYes={async () => {
				const password = generatePassword(8);

				try {
					await POST(
						`/auth/${userInfo?.role}/accounts/passwords/other`,
						{
							username,
							password,
						},
						userInfo!.token
					);

					setPopupMessage({
						type: "success",
						content: `Das neue Passwort ist: ${password}
							    Bitte geben Sie es and den Accountbesitzer weiter und leiten Sie ihn an es für sich zu ändern.`,
					});
				} catch {
					setPopupMessage({
						type: "error",
						content: "Da hat etwas leider nicht funktioniert.",
					});
				}
			}}
		/>
	);
}

export default ResetPasswordPopup;
