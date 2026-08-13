"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const usePreferencesStore = create<{ theme: "ocean" | "night"; haptics: boolean; toggleTheme: () => void; toggleHaptics: () => void }>()(
  persist((set) => ({ theme: "ocean", haptics: true, toggleTheme: () => set((state) => ({ theme: state.theme === "ocean" ? "night" : "ocean" })), toggleHaptics: () => set((state) => ({ haptics: !state.haptics })) }), { name: "fish-game-preferences" })
);

export function vibrate(pattern: number | number[] = 12) {
  if (typeof navigator !== "undefined" && usePreferencesStore.getState().haptics) navigator.vibrate?.(pattern);
}
