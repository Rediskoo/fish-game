"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLanguage = "ru" | "en" | "funny";
type LanguageState = { language: AppLanguage; setLanguage: (language: AppLanguage) => void };

function validLanguage(value: unknown): AppLanguage {
  return value === "en" || value === "funny" ? value : "ru";
}

export const useLanguageStore = create<LanguageState>()(
  persist<LanguageState>((set) => ({ language: "ru", setLanguage: (language) => set({ language }) }), {
    name: "fish-game-language",
    version: 2,
    migrate: (persisted) => {
      const old = persisted as { language?: unknown } | undefined;
      return { language: validLanguage(old?.language) } as LanguageState;
    },
    merge: (persisted, current) => {
      const stored = persisted as { language?: unknown } | undefined;
      return { ...current, language: validLanguage(stored?.language) };
    }
  })
);
