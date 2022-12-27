import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import YesNoPrompt from "../../components/util/YesNoPrompt";
import BetterInput from "../../components/util/BetterInput";
import { POST } from "../../api";
import { useAtom } from "jotai";
import { userInfoAtom, popupMessageAtom } from "../../stores/utility.store";

function ChangePassword() {
	const navigate = useNavigate();

	const username = useParams().username;
	const isSelf = username === undefined;

	const [userInfo] = useAtom(userInfoAtom);
	const [[oldPass, setOldPass], [newPass, setNewPass]] = [React.useState(""), React.useState("")];

	const [, setMessage] = useAtom(popupMessageAtom);

	return (
		<div className="page">
			<div
				className="panel"
				style={{ margin: 20, padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}
			>
				<h2>Passwort ändern {!isSelf && "für " + username}</h2>
				<table>
					<tbody>
						<tr>
							<th>Altes Passwort:</th>
							<td>
								<input type="password" onChange={(evt) => setOldPass(evt.target.value)} />
							</td>
						</tr>
						<tr>
							<th>Neues Passwort:</th>
							<td>
								<input type="password" onChange={(evt) => setNewPass(evt.target.value)} />
							</td>
						</tr>
					</tbody>
				</table>

				<p>Das neue Passwort muss mindestens acht Zeichen lang sein.</p>

				<YesNoPrompt
					header="Passwort ändern?"
					trigger={<button>Passwort ändern</button>}
					content={"Wollen Sie das Passwort wirklich ändern?"}
					onYes={async () => {
						if (newPass.length < 8) {
							return setMessage({
								type: "error",
								content: "Das neue Passwort muss mindestens 8 Zeichen enthalten.",
							});
						}

						try {
							await POST(
								`/auth/${userInfo?.role}/accounts/passwords/${isSelf ? "self" : "other"}`,
								{
									oldPassword: oldPass,
									newPassword: newPass,
								},
								userInfo!.token
							);

							if (isSelf) {
								navigate("/login");
							} else {
								navigate(userInfo!.home);
							}

							return;
						} catch {}

						setMessage({
							type: "error",
							content:
								"Das hat leider nicht funktioniert. Bitte überprüfen Sie Ihre Eingaben und versuchen es erneut.",
						});
					}}
				/>
			</div>
		</div>
	);
}

export default ChangePassword;
