"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useProfilePreferencesStore = create<{ nickname: string; avatar: string | null; setNickname: (nickname: string) => void; setAvatar: (avatar: string) => void }>()(
  persist((set) => ({ nickname: "Аквариумист", avatar: null, setNickname: (nickname) => set({ nickname: nickname.trim().slice(0, 18) || "Аквариумист" }), setAvatar: (avatar) => set({ avatar }) }), { name: "fish-game-profile", version: 1 })
);
