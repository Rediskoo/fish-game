import type { FishSpecies, GiftType, Rarity } from "@prisma/client";

export type FishView = {
  id: string;
  name: string;
  ageSeconds: number;
  species: FishSpecies;
  rarity: Rarity;
  typeName: string;
  incomePerSecond: number;
  swimSpeed: number;
  hunger: number;
  maxHunger: number;
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
  dailyReward: {
    amount: number;
    claimedToday: boolean;
    nextClaimAt: string;
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
  hungerPerMinute: number;
  maxHunger: number;
  experienceReward: number;
  color: string;
  glowColor: string;
};

export type AcquiredFish = FishView & {
  displayName: string;
  dropChanceBps: number;
  message: string;
};

export type PendingGiftView = {
  id: string;
  type: GiftType;
  amount: number;
  createdAt: string;
  sender: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
  };
};

export type FriendView = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  fishCount: number;
  level: number;
  friendsSince: string;
  lastGiftAt: string | null;
  pendingGift: PendingGiftView | null;
  fish: FishView[];
};

export type FriendRequestView = {
  id: string;
  direction: "incoming" | "outgoing";
  telegramId: string;
  username: string | null;
  firstName: string | null;
  createdAt: string;
};

export type FriendsPayload = {
  friends: FriendView[];
  requests: FriendRequestView[];
};

export type FriendGiftOption = {
  type: GiftType;
  label: string;
  cost: number;
};
