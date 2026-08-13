import genetics from "../../assets/breeding-genetics.json";
import type { BreedingParentSnapshot, FishGenome } from "./types";

type HybridConfig = (typeof genetics.hybrids)[keyof typeof genetics.hybrids];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-");
}

export function findHybrid(parentA: string, parentB: string): { key: string; config: HybridConfig } | null {
  const parents = [normalize(parentA), normalize(parentB)].sort();
  const entry = Object.entries(genetics.hybrids).find(([, config]) => [...config.parents].map(normalize).sort().join("|") === parents.join("|"));
  return entry ? { key: entry[0], config: entry[1] } : null;
}

export function isHybridSupported(parentA: string, parentB: string) {
  return findHybrid(parentA, parentB) !== null;
}

export function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  return {
    next,
    pick<T>(values: readonly T[]) {
      return values[Math.floor(next() * values.length)] ?? values[0];
    }
  };
}

export function createChildGenome(parentA: BreedingParentSnapshot, parentB: BreedingParentSnapshot, seed: number): FishGenome {
  const hybrid = findHybrid(parentA.species, parentB.species);
  if (!hybrid) throw new Error("Для этой пары пока нет готового визуального варианта");
  const random = createSeededRandom(seed);
  const trait = (parent: BreedingParentSnapshot, key: keyof FishGenome) => String(parent.genome?.[key] ?? parent.species);
  const configTraits = hybrid.config.traits;
  const rareParent = [parentA, parentB].find((parent) => ["EPIC", "LEGENDARY"].includes(parent.rarity));
  const patternMutation = random.next() < 0.35 ? `mutation-${seed % 7}` : null;
  const glow = rareParent && random.next() < 0.55 ? trait(rareParent, "glow") : random.next() < 0.08 ? `glow-${seed % 5}` : null;
  const specialTrait = configTraits.specialTrait ?? (random.next() < 0.05 ? `special-${seed % 4}` : null);

  return {
    bodyShape: random.pick([trait(parentA, "bodyShape"), trait(parentB, "bodyShape"), configTraits.bodyShape]),
    primaryColor: random.pick([trait(parentA, "primaryColor"), trait(parentB, "primaryColor"), configTraits.primaryColor]),
    secondaryColor: random.next() < 0.65 ? trait(parentB, "secondaryColor") : trait(parentA, "secondaryColor"),
    pattern: patternMutation ?? random.pick([trait(parentA, "pattern"), trait(parentB, "pattern"), configTraits.pattern]),
    tailShape: random.pick([trait(parentA, "tailShape"), trait(parentB, "tailShape"), configTraits.tailShape]),
    finShape: random.pick([trait(parentA, "finShape"), trait(parentB, "finShape"), configTraits.finShape]),
    glow,
    specialTrait,
    mutationSeed: seed
  };
}

export const breedingGeneticsVersion = genetics.version;

const fishSpeciesKeys: Record<string, string> = {
  GOLDFISH: "goldfish", GUPPY: "guppy", BETTA: "betta", NEON_TETRA: "neon-tetra",
  ANGELFISH: "angelfish", DISCUS: "discus", MANDARINFISH: "crystal-tang", DRAGON_KOI: "celestial-koi"
};

export function breedingSpeciesKey(fish: { species: string; hybridKey?: string | null }) {
  return fish.hybridKey ?? fishSpeciesKeys[fish.species] ?? normalize(fish.species);
}
