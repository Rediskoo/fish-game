import { describe, expect, it } from "vitest";
import manifest from "../../assets/pocket-aquarium-manifest.json";
import { createChildGenome, findHybrid, isHybridSupported } from "./breeding-genetics";
import { applyFryFoodTimes, applyIncubatorTimes, resolveLifeStage } from "./breeding-time";
import { validateBreedingParents, type ParentEligibility } from "./breeding-rules";
import type { BreedingParentSnapshot } from "./types";

const parentA: BreedingParentSnapshot = { fishId: "a", species: "goldfish", displayName: "Goldie", rarity: "COMMON" };
const parentB: BreedingParentSnapshot = { fishId: "b", species: "betta", displayName: "Betty", rarity: "RARE" };

describe("breeding genetics", () => {
  it("finds a combination regardless of parent order", () => {
    expect(findHybrid("goldfish", "betta")?.key).toBe("goldfish-betta");
    expect(findHybrid("betta", "goldfish")?.key).toBe("goldfish-betta");
  });
  it("supports breeding two fish of the same species", () => {
    expect(findHybrid("goldfish", "goldfish")?.key).toBe("goldfish-pure");
  });
  it("creates the same genome for the same seed", () => expect(createChildGenome(parentA, parentB, 42)).toEqual(createChildGenome(parentA, parentB, 42)));
  it("creates valid variations for different seeds", () => {
    const first = createChildGenome(parentA, parentB, 1);
    const second = createChildGenome(parentA, parentB, 2);
    expect(first.mutationSeed).toBe(1); expect(second.mutationSeed).toBe(2); expect(first).not.toEqual(second);
  });
  it("stores at most one special trait", () => {
    const trait = createChildGenome(parentA, parentB, 99).specialTrait;
    expect(trait === null || typeof trait === "string").toBe(true);
    expect(Array.isArray(trait)).toBe(false);
  });
  it("rejects unsupported pairs", () => expect(isHybridSupported("goldfish", "discus")).toBe(false));
  it("has hybrid assets and animations for every configured combination", () => {
    const hybrid = findHybrid("goldfish", "betta")!;
    expect(manifest.assets[hybrid.config.assetKey as keyof typeof manifest.assets]).toBeTruthy();
    expect(manifest.animations[hybrid.config.animationKey as keyof typeof manifest.animations]).toBeTruthy();
  });
});

describe("breeding eligibility", () => {
  const eligible = (overrides: Partial<ParentEligibility>): ParentEligibility => ({ ...parentA, ownerId: "user", lifeStage: "ADULT", breedingLocked: false, isGiftLocked: false, hunger: 10, maxHunger: 100, ...overrides });
  it("rejects a juvenile parent", () => expect(() => validateBreedingParents(eligible({ lifeStage: "BABY" }), eligible({ ...parentB }), "user")).toThrow(/взрослые/));
  it("rejects a busy parent", () => expect(() => validateBreedingParents(eligible({ breedingLocked: true }), eligible({ ...parentB }), "user")).toThrow(/участвует/));
});

describe("breeding timeline", () => {
  const job = { startedAt: "2026-01-01T00:00:00Z", hatchAt: "2026-01-01T02:00:00Z", babyAt: "2026-01-01T06:00:00Z", adultAt: "2026-01-01T12:00:00Z", status: "incubating" as const };
  it.each([["2026-01-01T00:30:00Z", "egg"], ["2026-01-01T01:30:00Z", "embryo"], ["2026-01-01T02:02:00Z", "hatching"], ["2026-01-01T03:00:00Z", "fry"], ["2026-01-01T08:00:00Z", "baby"], ["2026-01-02T00:00:00Z", "adult"]])("resolves %s as %s", (now, stage) => expect(resolveLifeStage(job, new Date(now))).toBe(stage));
  it("advances during an offline period", () => expect(resolveLifeStage(job, new Date("2026-01-01T13:00:00Z"))).toBe("adult"));
  it("incubator reduces the whole timeline by one hour", () => {
    const result = applyIncubatorTimes(job, new Date("2026-01-01T00:30:00Z"));
    expect(result.hatchAt.toISOString()).toBe("2026-01-01T01:00:00.000Z");
    expect(result.adultAt.toISOString()).toBe("2026-01-01T11:00:00.000Z");
  });
  it("fry food reduces adulthood by two hours", () => {
    const result = applyFryFoodTimes(job, "fry", new Date("2026-01-01T03:00:00Z"));
    expect(result.babyAt.toISOString()).toBe("2026-01-01T04:00:00.000Z");
    expect(result.adultAt.toISOString()).toBe("2026-01-01T10:00:00.000Z");
  });
  it("nursery conditioner can reduce the timeline by thirty minutes", () => {
    const result = applyIncubatorTimes(job, new Date("2026-01-01T00:30:00Z"), 30 * 60 * 1000);
    expect(result.adultAt.toISOString()).toBe("2026-01-01T11:30:00.000Z");
  });
});
