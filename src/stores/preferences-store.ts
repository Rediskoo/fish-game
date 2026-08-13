"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppTheme = "ocean" | "halloween" | "midnight" | "snow" | "sunset" | "violet" | "emerald";

export const themeOptions: Array<{ id: AppTheme; label: string; colors: [string, string, string] }> = [
  { id: "ocean", label: "Океан", colors: ["#41d9ea", "#075985", "#031725"] },
  { id: "halloween", label: "Хэллоуин", colors: ["#fb923c", "#581c87", "#050308"] },
  { id: "midnight", label: "Чёрная", colors: ["#94a3b8", "#18181b", "#000000"] },
  { id: "snow", label: "Снежная", colors: ["#ffffff", "#93c5fd", "#164e63"] },
  { id: "sunset", label: "Закат", colors: ["#fb7185", "#f59e0b", "#4c1d95"] },
  { id: "violet", label: "Неоновая", colors: ["#e879f9", "#7c3aed", "#172554"] },
  { id: "emerald", label: "Изумруд", colors: ["#6ee7b7", "#047857", "#022c22"] }
];

export const usePreferencesStore = create<{ theme: AppTheme; haptics: boolean; setTheme: (theme: AppTheme) => void; toggleHaptics: () => void }>()(
  persist((set) => ({ theme: "ocean", haptics: true, setTheme: (theme) => set({ theme }), toggleHaptics: () => set((state) => ({ haptics: !state.haptics })) }), { name: "fish-game-preferences", version: 2 })
);

export function vibrate(pattern: number | number[] = 12) {
  if (typeof navigator !== "undefined" && usePreferencesStore.getState().haptics) navigator.vibrate?.(pattern);
}
