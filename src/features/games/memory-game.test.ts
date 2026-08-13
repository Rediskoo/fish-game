import { describe, expect, it } from "vitest";
import { calculateMemoryReward, hasValidPairs, memorySymbols } from "./memory-game";

describe("memory pairs", () => {
  it("requires exactly two cards for every symbol", () => {
    expect(hasValidPairs([...memorySymbols, ...memorySymbols])).toBe(true);
    expect(hasValidPairs([...memorySymbols, "🐟"])).toBe(false);
  });

  it("rewards efficient play but keeps a minimum prize", () => {
    expect(calculateMemoryReward(6)).toBe(100);
    expect(calculateMemoryReward(12)).toBe(64);
    expect(calculateMemoryReward(999)).toBe(20);
  });
});
