"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLanguage = "ru" | "en";

export const useLanguageStore = create<{ language: AppLanguage; setLanguage: (language: AppLanguage) => void }>()(
  persist((set) => ({ language: "ru", setLanguage: (language) => set({ language }) }), { name: "fish-game-language" })
);

