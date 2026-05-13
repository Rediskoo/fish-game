import type { FishSpecies, Rarity } from "@prisma/client";

export type FishView = {
  id: string;
  name: string;
  ageSeconds: number;
  species: FishSpecies;
  rarity: Rarity;
  incomePerSecond: number;
  swimSpeed: number;
  hunger: number;
  color: string;
  glowColor: string;
  animationState: unknown;
};

export type AquariumSnapshot = {
  user: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    currency: number;
  };
  aquarium: {
    id: string;
    name: string;
    level: number;
    experience: number;
    lastIncomeAt: string;
  };
  inventory: {
    food: number;
  };
  fish: FishView[];
  incomePerSecond: number;
  offlineIncome: number;
};

export type MarketplaceFish = {
  id: string;
  species: FishSpecies;
  rarity: Rarity;
  displayName: string;
  dropChanceBps: number;
  incomePerSecond: number;
  swimSpeed: number;
  color: string;
  glowColor: string;
};
