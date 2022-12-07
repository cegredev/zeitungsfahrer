import { atom } from "jotai";

export const errorMessageAtom = atom("", (_get, set, message: string) => {
	set(errorMessageAtom, message);
});

export const authTokenAtom = atom<string | undefined>(undefined);
export const userRoleAtom = atom<"main" | "plan" | "accountAdmin" | "vendor" | undefined>(undefined);

export const settingsLoggedInAtom = atom(true);
