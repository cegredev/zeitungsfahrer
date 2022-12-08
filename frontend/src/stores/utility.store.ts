import { LoginResult } from "backend/src/models/accounts.model";
import { atom } from "jotai";

export const errorMessageAtom = atom("", (_get, set, message: string) => {
	set(errorMessageAtom, message);
});

export const userInfoAtom = atom<LoginResult | undefined>(undefined);
export const authTokenAtom = atom<string | undefined>((get) => get(userInfoAtom)?.token);

export const settingsLoggedInAtom = atom(true);
