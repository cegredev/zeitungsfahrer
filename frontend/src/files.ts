import { Url } from "url";

export function downloadBlob(blob: Blob, name: string) {
	downloadUrl(URL.createObjectURL(blob), name);
}

export function downloadUrl(url: string, name: string) {
	// create "a" HTML element with href to file & click
	const link = document.createElement("a");
	link.href = url;
	link.setAttribute("download", name); //or any other extension
	document.body.appendChild(link);
	link.click();

	// clean up "a" element & remove ObjectURL
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
