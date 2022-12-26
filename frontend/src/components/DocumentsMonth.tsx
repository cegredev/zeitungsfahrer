import { DocMeta } from "backend/src/models/documents.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { DELETE, GET_BLOB } from "../api";
import { months } from "../consts";
import { downloadUrl } from "../files";
import { userInfoAtom } from "../stores/utility.store";
import DownloadLink from "./DownloadLink";
import YesNoPrompt from "./util/YesNoPrompt";

interface Props {
	documents: DocMeta[];
	month: number;
	removeDoc: (id: number) => void;
}

function DocumentsMonth({ documents, month, removeDoc }: Props) {
	const [userInfo] = useAtom(userInfoAtom);

	return (
		<div>
			<h3 style={{ margin: 5 }}>{months[month]}</h3>
			{documents.length > 0 && (
				<table>
					<thead>
						<tr>
							<th>Typ</th>
							<th>Datum</th>
							<th>Name</th>
						</tr>
					</thead>
					<tbody>
						{documents.map((doc) => {
							const docName = doc.id + "-" + doc.description;

							return (
								<tr key={docName}>
									<td>{doc.type === "invoice" ? "Rechnung" : "Bericht"}</td>
									<td>{dayjs(doc.date).format("DD.MM.YYYY")}</td>
									<td>
										<DownloadLink
											path={`/auth/${userInfo!.role}/documents/download/${doc.type}/${doc.id}`}
											name={docName}
											format={doc.format}
											save={false}
										/>
									</td>
									<td>
										{userInfo!.role === "main" && (
											<YesNoPrompt
												content="Wollen Sie dieses Dokument wirklich löschen?"
												header="Dokument löschen?"
												trigger={<button>Löschen</button>}
												onYes={async () => {
													await DELETE(
														`/auth/main/documents?type=${doc.type}&id=${doc.id}`,
														userInfo!.token!
													);

													removeDoc(doc.id);
												}}
											/>
										)}
									</td>
									<td>
										<button
											onClick={async () => {
												const response = await GET_BLOB(
													`/auth/${userInfo!.role}/documents/download/${doc.type}/${doc.id}`,
													userInfo!.token
												);

												const url = URL.createObjectURL(response.data);
												downloadUrl(url, docName + "." + doc.format);
											}}
										>
											Herunterladen
										</button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}
		</div>
	);
}

export default DocumentsMonth;
