import { useAtom } from "jotai";
import React from "react";
import { GET_BLOB } from "../api";
import { openAndDownloadFile, openFile } from "../consts";
import { authTokenAtom } from "../stores/utility.store";

interface Props {
	path: string;
	name: string;
	format: string;
	save: boolean;
}

function DownloadLink({ path, name, format, save }: Props) {
	const [token] = useAtom(authTokenAtom);

	return (
		<label
			className="download-link"
			onClick={async () => {
				const response = await GET_BLOB(path, token!);

				const fileUrl = URL.createObjectURL(response.data);

				if (save) {
					openAndDownloadFile(name, "." + format, fileUrl);
				} else {
					openFile(name, fileUrl);
				}
			}}
		>
			{name}
		</label>
	);
}

export default DownloadLink;
