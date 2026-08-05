import type { FishSpecies } from "@prisma/client";

const asset = (path: string) => `/assets/${path}`;

export const AppAssets = {
  shop: {
    building: asset("shop/shop_building.png"),
    caseChest: asset("shop/case_chest.png"),
    careFood: asset("shop/care_food.png"),
    decorRuins: asset("shop/decor_ruins.png"),
    equipmentFilter: asset("shop/equipment_filter.png"),
    aquariumDisplay: asset("shop/aquarium_display.png")
  },
  care: {
    foodBasic: asset("care/food_basic.png"),
    foodPremium: asset("care/food_premium.png"),
    waterConditioner: asset("care/water_conditioner.png")
  },
  decor: {
    plantSmall: asset("decor/plant_small.png"),
    plantTall: asset("decor/plant_tall.png"),
    coralRed: asset("decor/coral_red.png"),
    coralPurple: asset("decor/coral_purple.png"),
    rockPile: asset("decor/rock_pile.png"),
    caveSmall: asset("decor/cave_small.png"),
    caveLarge: asset("decor/cave_large.png"),
    stoneBridge: asset("decor/stone_bridge.png"),
    stoneArch: asset("decor/stone_arch.png"),
    lantern: asset("decor/lantern.png"),
    amphora: asset("decor/amphora.png"),
    shell: asset("decor/shell.png")
  },
  equipment: {
    internalFilter: asset("equipment/internal_filter.png"),
    externalFilter: asset("equipment/external_filter.png"),
    airPump: asset("equipment/air_pump.png"),
    aerator: asset("equipment/aerator.png"),
    heater: asset("equipment/heater.png"),
    aquariumLamp: asset("equipment/aquarium_lamp.png")
  },
  backgrounds: {
    full: {
      deepLagoon: asset("backgrounds/full/deep_lagoon.png"),
      coralGarden: asset("backgrounds/full/coral_garden.png"),
      moonReef: asset("backgrounds/full/moon_reef.png"),
      sunkenTemple: asset("backgrounds/full/sunken_temple.png"),
      tropicalRiver: asset("backgrounds/full/tropical_river.png"),
      nightCove: asset("backgrounds/full/night_cove.png")
    },
    previews: {
      deepLagoon: asset("backgrounds/previews/deep_lagoon.png"),
      coralGarden: asset("backgrounds/previews/coral_garden.png"),
      moonReef: asset("backgrounds/previews/moon_reef.png"),
      sunkenTemple: asset("backgrounds/previews/sunken_temple.png"),
      tropicalRiver: asset("backgrounds/previews/tropical_river.png"),
      nightCove: asset("backgrounds/previews/night_cove.png")
    }
  }
} as const;

export const fishSpeciesAsset: Record<FishSpecies, string> = {
  GUPPY: AppAssets.shop.aquariumDisplay,
  GOLDFISH: AppAssets.shop.caseChest,
  BETTA: AppAssets.shop.caseChest,
  NEON_TETRA: AppAssets.shop.aquariumDisplay,
  ANGELFISH: AppAssets.shop.aquariumDisplay,
  DISCUS: AppAssets.shop.aquariumDisplay,
  MANDARINFISH: AppAssets.shop.caseChest,
  DRAGON_KOI: AppAssets.shop.caseChest
};

export type ShopCategory = "cases" | "care" | "decor" | "equipment" | "backgrounds";

export type ShopProduct = {
  id: string;
  title: string;
  category: ShopCategory;
  price: number;
  image: string;
  status?: string;
  repeatable: boolean;
};

export const shopProducts: ShopProduct[] = [
  { id: "fish-case", title: "Рыбный кейс", category: "cases", price: 100, image: AppAssets.shop.caseChest, status: "Рулетка", repeatable: true },
  { id: "food-basic", title: "Обычный корм", category: "care", price: 10, image: AppAssets.care.foodBasic, status: "+10", repeatable: true },
  { id: "food-premium", title: "Улучшенный корм", category: "care", price: 30, image: AppAssets.care.foodPremium, repeatable: true },
  { id: "water-conditioner", title: "Очиститель воды", category: "care", price: 45, image: AppAssets.care.waterConditioner, repeatable: true },
  { id: "plant-small", title: "Малое растение", category: "decor", price: 35, image: AppAssets.decor.plantSmall, repeatable: false },
  { id: "plant-tall", title: "Высокое растение", category: "decor", price: 55, image: AppAssets.decor.plantTall, repeatable: false },
  { id: "coral-red", title: "Красный коралл", category: "decor", price: 70, image: AppAssets.decor.coralRed, repeatable: false },
  { id: "stone-bridge", title: "Каменный мост", category: "decor", price: 120, image: AppAssets.decor.stoneBridge, repeatable: false },
  { id: "internal-filter", title: "Фильтр", category: "equipment", price: 90, image: AppAssets.equipment.internalFilter, repeatable: false },
  { id: "aerator", title: "Аэратор", category: "equipment", price: 110, image: AppAssets.equipment.aerator, repeatable: false },
  { id: "heater", title: "Обогреватель", category: "equipment", price: 100, image: AppAssets.equipment.heater, repeatable: false },
  { id: "deep-lagoon", title: "Глубокая лагуна", category: "backgrounds", price: 150, image: AppAssets.backgrounds.previews.deepLagoon, repeatable: false },
  { id: "coral-garden", title: "Коралловый сад", category: "backgrounds", price: 180, image: AppAssets.backgrounds.previews.coralGarden, repeatable: false },
  { id: "sunken-temple", title: "Затонувший храм", category: "backgrounds", price: 220, image: AppAssets.backgrounds.previews.sunkenTemple, repeatable: false }
];

