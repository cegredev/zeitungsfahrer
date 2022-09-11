import { atom } from "jotai";

export const errorMessageAtom = atom("", (_get, set, message: string) => {
	set(errorMessageAtom, message);
});
