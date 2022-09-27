import { atom } from "jotai";

export const errorMessageAtom = atom("", (_get, set, message: string) => {
	set(errorMessageAtom, message);
});

export const authTokenAtom = atom<string | undefined>(undefined);

export const settingsLoggedInAtom = atom(false);
