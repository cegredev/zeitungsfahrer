import { Account, Role } from "backend/src/models/accounts.model";
import { useAtom } from "jotai";
import React from "react";
import { useImmer } from "use-immer";
import { DELETE, GET, POST } from "../api";
import ResetPasswordPopup from "../components/ResetPasswordPopup";
import BetterInput from "../components/util/BetterInput";
import YesNoPrompt from "../components/util/YesNoPrompt";
import { rolePrettyNames } from "../consts";
import { userInfoAtom } from "../stores/utility.store";

function Accounts() {
	const [userInfo] = useAtom(userInfoAtom);
	const [accounts, setAccounts] = useImmer<Account[]>([]);
	const [newAccount, setNewAccount] = useImmer<Account>({
		name: "",
		role: "dataEntry",
		password: "",
	});

	React.useEffect(() => {
		async function fetchData() {
			const res = await GET<Account[]>(`/auth/accountAdmin/accounts`, userInfo!.token);
			setAccounts(res.data);
		}

		fetchData();
	}, [userInfo, setAccounts]);

	return (
		<div className="page">
			<div className="panel" style={{ textAlign: "center", margin: 20 }}>
				<table className="table-with-border">
					<thead>
						<tr>
							<th>Name</th>
							<th>Rolle</th>
							<th>Passwort</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{accounts.map((account) => (
							<tr key={account.name}>
								<td>{account.prettyName || account.name}</td>
								<td>{rolePrettyNames.get(account.role)}</td>
								<td>
									<ResetPasswordPopup username={account.name} />
								</td>
								<td>
									{account.role !== "vendor" && (
										<YesNoPrompt
											content="Wollen Sie diesen Account wirklich löschen?"
											header="Account löschen"
											trigger={<button>Löschen</button>}
											onYes={async () => {
												await DELETE(
													`/auth/${userInfo?.role}/accounts?name=${account.name}`,
													userInfo!.token
												);

												setAccounts((accounts) =>
													accounts.filter((acc) => acc.name !== account.name)
												);
											}}
										/>
									)}
								</td>
							</tr>
						))}
					</tbody>
					<tfoot>
						<tr>
							<td>
								<input
									type="text"
									value={newAccount.name}
									onChange={(evt) => {
										const value = evt.target.value;
										if (value.includes(":")) return;

										setNewAccount((account) => {
											account.name = value;
										});
									}}
								/>
							</td>
							<td>
								<select
									value={newAccount.role}
									onChange={(evt) => {
										setNewAccount((account) => {
											// @ts-ignore
											account.role = evt.target.value;
										});
									}}
								>
									{[...rolePrettyNames.entries()]
										.filter(([role]) => role !== "vendor")
										.map(([role, prettyName]) => (
											<option key={role} value={role}>
												{prettyName}
											</option>
										))}
								</select>
							</td>
							<td>
								<input
									type="text"
									value={newAccount.password}
									onChange={(evt) => {
										setNewAccount((account) => {
											account.password = evt.target.value;
										});
									}}
								/>
							</td>
							<td>
								<button
									onClick={async () => {
										await POST(`/auth/${userInfo?.role}/accounts`, newAccount, userInfo!.token);

										setAccounts((accounts) => {
											accounts.push(newAccount);
										});

										setNewAccount({
											name: "",
											role: newAccount.role,
											password: "",
										});
									}}
								>
									Erstellen
								</button>
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	);
}

export default Accounts;
