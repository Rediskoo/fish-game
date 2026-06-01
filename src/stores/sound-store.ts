"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type SoundSettings = {
  all: boolean;
  buttons: boolean;
  roulette: boolean;
  fish: boolean;
  setSound: (key: "all" | "buttons" | "roulette" | "fish", value: boolean) => void;
};

export const useSoundStore = create<SoundSettings>()(
  persist(
    (set) => ({
      all: true,
      buttons: true,
      roulette: true,
      fish: true,
      setSound: (key, value) => set({ [key]: value })
    }),
    { name: "fish-game-sounds" }
  )
);

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  audioContext ??= new AudioContext();
  return audioContext;
}

export function playTone(kind: "button" | "roulette" | "rare" | "fish") {
  const settings = useSoundStore.getState();
  if (!settings.all) return;
  if (kind === "button" && !settings.buttons) return;
  if ((kind === "roulette" || kind === "rare") && !settings.roulette) return;
  if (kind === "fish" && !settings.fish) return;

  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  const frequency = kind === "rare" ? 740 : kind === "roulette" ? 420 : kind === "fish" ? 520 : 360;
  oscillator.type = kind === "rare" ? "triangle" : "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.2, now + 0.09);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(kind === "rare" ? 0.09 : 0.04, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.16);
}
