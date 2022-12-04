import fs from "fs/promises";

export async function ensureDirExists(path: string): Promise<void> {
	await fs.mkdir(path, { recursive: true });
}

export async function fileExists(path: string) {
	return fs
		.access(path, fs.constants.F_OK)
		.then(() => true)
		.catch(() => false);
}
