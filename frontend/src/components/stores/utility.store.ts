import { atom } from "jotai";

export const errorMessageAtom = atom("", (_get, set, message: string) => {
	set(errorMessageAtom, message);
});

export const clearErrorMessageAtom = atom(undefined, (_get, set) => {
	set(errorMessageAtom, "");
});
