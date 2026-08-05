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

export type ShopCategory = "fish" | "care" | "decor" | "backgrounds";

export type ShopProduct = {
  id: string;
  title: string;
  category: ShopCategory;
  price: number;
  image: string;
  description: string;
  accent: string;
  status?: string;
  repeatable: boolean;
  fullImage?: string;
};

export const shopCategories: Array<{ id: ShopCategory; title: string; subtitle: string; image: string; accent: string }> = [
  { id: "fish", title: "Рыбки", subtitle: "Кейсы и редкость", image: AppAssets.shop.caseChest, accent: "#49C7E8" },
  { id: "care", title: "Уход", subtitle: "Корм и здоровье", image: AppAssets.shop.careFood, accent: "#E5B74F" },
  { id: "decor", title: "Декор", subtitle: "Предметы в аквариум", image: AppAssets.shop.decorRuins, accent: "#62D4AC" },
  { id: "backgrounds", title: "Фоны", subtitle: "Вид аквариума", image: AppAssets.shop.aquariumDisplay, accent: "#9B7BEF" }
];

export const shopProducts: ShopProduct[] = [
  { id: "fish-case", title: "Рыбки", category: "fish", price: 100, image: AppAssets.shop.caseChest, description: "Открывает казино 777 с рыбками и призами.", accent: "#49C7E8", status: "777", repeatable: true },
  { id: "food-basic", title: "Обычный корм", category: "care", price: 10, image: AppAssets.care.foodBasic, description: "+10 корма для ежедневного ухода.", accent: "#E5B74F", status: "+10", repeatable: true },
  { id: "food-premium", title: "Улучшенный корм", category: "care", price: 30, image: AppAssets.care.foodPremium, description: "Премиальная порция корма. Сейчас добавляет +25 корма.", accent: "#E5B74F", status: "+25", repeatable: true },
  { id: "water-conditioner", title: "Очиститель воды", category: "care", price: 45, image: AppAssets.care.waterConditioner, description: "Запас ухода. Сейчас добавляет +35 корма как расходник.", accent: "#62D4AC", status: "+35", repeatable: true },
  { id: "plant-small", title: "Малое растение", category: "decor", price: 35, image: AppAssets.decor.plantSmall, description: "Компактная зелень у дна аквариума.", accent: "#62D4AC", repeatable: false },
  { id: "plant-tall", title: "Высокое растение", category: "decor", price: 55, image: AppAssets.decor.plantTall, description: "Высокое растение для глубины сцены.", accent: "#62D4AC", repeatable: false },
  { id: "coral-red", title: "Красный коралл", category: "decor", price: 70, image: AppAssets.decor.coralRed, description: "Тёплый коралл с мягким свечением.", accent: "#FF7FA3", repeatable: false },
  { id: "coral-purple", title: "Фиолетовый коралл", category: "decor", price: 70, image: AppAssets.decor.coralPurple, description: "Фиолетовый акцент для правой части аквариума.", accent: "#9B7BEF", repeatable: false },
  { id: "stone-bridge", title: "Каменный мост", category: "decor", price: 120, image: AppAssets.decor.stoneBridge, description: "Центральный декоративный мост.", accent: "#62D4AC", repeatable: false },
  { id: "lantern", title: "Фонарь", category: "decor", price: 95, image: AppAssets.decor.lantern, description: "Тёплый свет у дна аквариума.", accent: "#E5B74F", repeatable: false },
  { id: "amphora", title: "Амфора", category: "decor", price: 85, image: AppAssets.decor.amphora, description: "Затонувшая амфора для нижнего слоя.", accent: "#E5B74F", repeatable: false },
  { id: "deep-lagoon", title: "Глубокая лагуна", category: "backgrounds", price: 150, image: AppAssets.backgrounds.previews.deepLagoon, fullImage: AppAssets.backgrounds.full.deepLagoon, description: "Базовый глубокий синий фон.", accent: "#49C7E8", repeatable: false },
  { id: "coral-garden", title: "Коралловый сад", category: "backgrounds", price: 180, image: AppAssets.backgrounds.previews.coralGarden, fullImage: AppAssets.backgrounds.full.coralGarden, description: "Больше красок и кораллов на заднем плане.", accent: "#FF7FA3", repeatable: false },
  { id: "moon-reef", title: "Лунный риф", category: "backgrounds", price: 190, image: AppAssets.backgrounds.previews.moonReef, fullImage: AppAssets.backgrounds.full.moonReef, description: "Спокойный риф с прохладным свечением.", accent: "#9B7BEF", repeatable: false },
  { id: "sunken-temple", title: "Затонувший храм", category: "backgrounds", price: 220, image: AppAssets.backgrounds.previews.sunkenTemple, fullImage: AppAssets.backgrounds.full.sunkenTemple, description: "Драматичный фон с древними деталями.", accent: "#E5B74F", repeatable: false },
  { id: "tropical-river", title: "Тропическая река", category: "backgrounds", price: 210, image: AppAssets.backgrounds.previews.tropicalRiver, fullImage: AppAssets.backgrounds.full.tropicalRiver, description: "Зелёная вода и мягкий природный свет.", accent: "#62D4AC", repeatable: false },
  { id: "night-cove", title: "Ночной грот", category: "backgrounds", price: 210, image: AppAssets.backgrounds.previews.nightCove, fullImage: AppAssets.backgrounds.full.nightCove, description: "Тёмный фон с ночной глубиной.", accent: "#9B7BEF", repeatable: false }
];

export const shopProductsById = Object.fromEntries(shopProducts.map((product) => [product.id, product])) as Record<string, ShopProduct>;

export const backgroundImageById = Object.fromEntries(
  shopProducts.filter((product) => product.category === "backgrounds").map((product) => [product.id, product.fullImage ?? product.image])
) as Record<string, string>;

export const decorProducts = shopProducts.filter((product) => product.category === "decor");
export const decorImageById = Object.fromEntries(decorProducts.map((product) => [product.id, product.image])) as Record<string, string>;