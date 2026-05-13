import { create } from "zustand";

type IncomeState = {
  optimisticCurrency: number;
  incomePerSecond: number;
  setIncome: (currency: number, incomePerSecond: number) => void;
  tick: (deltaSeconds: number) => void;
};

export const useIncomeStore = create<IncomeState>((set) => ({
  optimisticCurrency: 0,
  incomePerSecond: 0,
  setIncome: (optimisticCurrency, incomePerSecond) => set({ optimisticCurrency, incomePerSecond }),
  tick: (deltaSeconds) =>
    set((state) => ({
      optimisticCurrency: state.optimisticCurrency + state.incomePerSecond * deltaSeconds
    }))
}));
