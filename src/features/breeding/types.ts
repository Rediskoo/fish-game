export type FishLifeStageValue = "egg" | "embryo" | "hatching" | "fry" | "baby" | "adult";

export type FishGenome = {
  bodyShape: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  tailShape: string;
  finShape: string;
  glow: string | null;
  specialTrait: string | null;
  mutationSeed: number;
};

export type BreedingParentSnapshot = {
  fishId: string;
  species: string;
  displayName: string;
  genome?: FishGenome;
  rarity: string;
};

export type BreedingJobView = {
  id: string;
  parentA: BreedingParentSnapshot;
  parentB: BreedingParentSnapshot;
  hybridKey: string;
  genome: FishGenome;
  rarity: string;
  status: "incubating" | "ready-to-hatch" | "hatched" | "growing" | "ready-to-grow" | "completed" | "cancelled";
  lifeStage: FishLifeStageValue;
  startedAt: string;
  hatchAt: string;
  babyAt: string;
  adultAt: string;
  claimedAt: string | null;
  resultingFishId: string | null;
  speedupsUsed: number;
};

export type BreedingPayload = {
  jobs: BreedingJobView[];
  inventory: { spawningNest: number; eggIncubator: number; fryFood: number; nurseryConditioner: number; genealogyMedallion: number };
  serverNow: string;
  maxConcurrentJobs: number;
};
