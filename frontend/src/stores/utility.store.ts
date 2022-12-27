import { LoginResult } from "backend/src/models/accounts.model";
import { atom } from "jotai";

export interface PopupMessage {
	type: "info" | "success" | "error";
	content: string;
}

export const popupMessageAtom = atom<PopupMessage | undefined>(undefined);

export const userInfoAtom = atom<LoginResult | undefined>(undefined);
export const authTokenAtom = atom<string | undefined>((get) => get(userInfoAtom)?.token);

export const settingsLoggedInAtom = atom(true);
