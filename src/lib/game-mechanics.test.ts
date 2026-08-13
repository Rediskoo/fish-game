import { describe, expect, it } from "vitest";
import {
  MAX_OFFLINE_SECONDS,
  calculateHunger,
  calculateOfflineSeconds,
  feedHunger,
  hungerIncomeMultiplier
} from "./game-mechanics";

describe("game mechanics", () => {
  it("caps offline income at seven days and rejects future timestamps", () => {
    const now = new Date("2026-08-13T12:00:00Z");
    expect(calculateOfflineSeconds(new Date("2026-08-01T00:00:00Z"), now)).toBe(MAX_OFFLINE_SECONDS);
    expect(calculateOfflineSeconds(new Date("2026-08-14T00:00:00Z"), now)).toBe(0);
  });

  it.each([[0, 1], [69, 1], [70, 0.6], [89, 0.6], [90, 0.25], [100, 0.25]])(
    "applies the expected hunger penalty at %i%%",
    (hunger, expected) => expect(hungerIncomeMultiplier(hunger, 100)).toBe(expected)
  );

  it("clamps hunger and feeding to valid boundaries", () => {
    expect(calculateHunger(95, 100, 2, 10)).toBe(100);
    expect(calculateHunger(20, 100, 2, -10)).toBe(20);
    expect(feedHunger(5)).toBe(0);
    expect(feedHunger(25)).toBe(15);
  });
});
