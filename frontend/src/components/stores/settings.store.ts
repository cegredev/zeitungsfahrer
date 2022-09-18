import { atom } from "jotai";
import { Settings } from "backend/src/models/settings.model";

export const settingsAtom = atom<Settings | undefined>(undefined);
