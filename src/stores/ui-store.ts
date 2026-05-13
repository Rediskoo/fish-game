import { create } from "zustand";

type UiState = {
  selectedFishId: string | null;
  onboardingDone: boolean;
  setSelectedFishId: (fishId: string | null) => void;
  finishOnboarding: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedFishId: null,
  onboardingDone: false,
  setSelectedFishId: (selectedFishId) => set({ selectedFishId }),
  finishOnboarding: () => set({ onboardingDone: true })
}));
