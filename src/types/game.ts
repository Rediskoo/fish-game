import type { FishLifeStage, FishOrigin, FishPersonality, FishSpecies, GiftType, Rarity } from "@prisma/client";
import type { FishGenome } from "@/features/breeding/types";

export type FishView = {
  id: string;
  name: string;
  ageSeconds: number;
  species: FishSpecies;
  rarity: Rarity;
  typeName: string;
  displayName: string;
  isFavorite: boolean;
  personality: FishPersonality;
  personalityLabel: string;
  birthday: string;
  description: string;
  rarityLabel: string;
  rarityColor: string;
  incomePerSecond: number;
  swimSpeed: number;
  hunger: number;
  maxHunger: number;
  color: string;
  glowColor: string;
  animationState: unknown;
  lifeStage: FishLifeStage;
  origin: FishOrigin;
  genome: FishGenome | null;
  hybridKey: string | null;
  parentIds: [string | null, string | null];
  breedingLocked: boolean;
};

export type AquariumSnapshot = {
  user: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    currency: number;
    createdAt: string;
  };
  aquarium: {
    id: string;
    name: string;
    level: number;
    experience: number;
    lastIncomeAt: string;
    backgroundId: string;
    decor: string[];
    pollution: number;
  };
  inventory: {
    food: number;
    bigFood: number;
    superFood: number;
    cleaner: number;
    superCleaner: number;
    spawningNest: number;
    eggIncubator: number;
    fryFood: number;
    nurseryConditioner: number;
    genealogyMedallion: number;
    ownedItemIds: string[];
  };
  dailyReward: {
    amount: number;
    claimedToday: boolean;
    nextClaimAt: string;
    streak: number;
  };
  achievements: AchievementView[];
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

export type CaseTapeItem = {
  key: string;
  displayName: string;
  rarity: Rarity;
  rarityLabel: string;
  rarityColor: string;
  color: string;
  glowColor: string;
};

export type CaseResult = {
  reels: [CaseTapeItem[], CaseTapeItem[], CaseTapeItem[]];
  symbols: [CaseTapeItem, CaseTapeItem, CaseTapeItem];
  reward: { kind: "fish"; fish: AcquiredFish } | { kind: "currency"; amount: number };
  durationMs: number;
};

export type PendingGiftView = {
  id: string;
  type: GiftType;
  amount: number;
  fishId: string | null;
  fish: AcquiredFish | null;
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

export type AchievementView = {
  id: string;
  key: string;
  title: string;
  description: string;
  reward: number;
  unlockedAt: string | null;
  current: number;
  target: number;
};
