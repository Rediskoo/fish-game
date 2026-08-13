import { describe, expect, it } from "vitest";
import { shopProducts } from "./app-assets";

const functionalConsumables = new Set([
  "spawning-nest", "egg-incubator", "fry-food", "nursery-conditioner", "genealogy-medallion",
  "big-water-cleaner", "food-basic", "food-premium", "food-large", "food-aquarium", "water-conditioner"
]);

describe("shop catalog", () => {
  it("has unique ids and a visible image for every product", () => {
    expect(new Set(shopProducts.map((product) => product.id)).size).toBe(shopProducts.length);
    for (const product of shopProducts) expect(product.image).toMatch(/^\/(?:pocket-aquarium-assets|assets)\//);
  });

  it("maps every care and breeding product to an implemented effect", () => {
    const consumables = shopProducts.filter((product) => product.category === "care" || product.category === "breeding");
    expect(consumables.filter((product) => !functionalConsumables.has(product.id))).toEqual([]);
  });

  it("has full images for every background", () => {
    for (const product of shopProducts.filter((item) => item.category === "backgrounds")) expect(product.fullImage).toBeTruthy();
  });
});
