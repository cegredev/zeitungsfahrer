import { useAtom } from "jotai";
import React from "react";
import { GET_BLOB } from "../api";
import { openAndDownloadFile } from "../consts";
import { authTokenAtom } from "../stores/utility.store";

interface Props {
	path: string;
	name: string;
	format: string;
}

function DownloadLink({ path, name, format }: Props) {
	const [token] = useAtom(authTokenAtom);

	return (
		<label
			className="download-link"
			onClick={async () => {
				const response = await GET_BLOB(path, token!);

				console.log(response.data);

				const fileUrl = URL.createObjectURL(response.data);
				openAndDownloadFile(name, "." + format, fileUrl);
			}}
		>
			{name}
		</label>
	);
}

export default DownloadLink;
