import type { FishSpecies } from "@prisma/client";
import { aquariumAssets, fishImageBySpecies } from "@/assets/aquarium-assets";

const asset = (path: string) => `/assets/${path}`;

export const AppAssets = {
  shop: {
    building: asset("shop/shop_building.png"),
    caseChest: aquariumAssets.categories.shop.fishCases,
    careFood: aquariumAssets.categories.shop.foodCare,
    decorRuins: aquariumAssets.categories.shop.decor,
    equipmentFilter: aquariumAssets.items.waterCleaner,
    aquariumDisplay: aquariumAssets.categories.shop.backgrounds
  },
  storage: {
    careFood: aquariumAssets.categories.storage.foodCare,
    decor: aquariumAssets.categories.storage.decor,
    backgrounds: aquariumAssets.categories.storage.backgrounds,
    fish: aquariumAssets.categories.storage.fish
  },
  care: {
    foodBasic: aquariumAssets.items.foodPelletJar,
    foodPremium: aquariumAssets.items.foodFlakesPouch,
    waterConditioner: aquariumAssets.items.waterCleaner,
    fryFood: aquariumAssets.breeding.fryFood,
    spawningNest: aquariumAssets.breeding.spawningNest,
    eggIncubator: aquariumAssets.breeding.eggIncubator,
    nurseryConditioner: aquariumAssets.breeding.nurseryConditioner,
    genealogyMedallion: aquariumAssets.breeding.genealogyMedallion
  },
  decor: {
    plantSmall: aquariumAssets.items.plantSmall,
    plantTall: aquariumAssets.items.plantTall,
    coralRed: aquariumAssets.items.coralRed,
    coralPurple: aquariumAssets.items.coralViolet,
    rockPile: aquariumAssets.items.pebbleCave,
    caveSmall: aquariumAssets.items.pebbleCave,
    caveLarge: aquariumAssets.items.pebbleCave,
    stoneBridge: aquariumAssets.items.stoneBridge,
    stoneArch: aquariumAssets.items.stoneBridge,
    lantern: aquariumAssets.items.pagodaLantern,
    amphora: aquariumAssets.items.treasureAmphora,
    shell: aquariumAssets.items.treasureAmphora
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
      deepLagoon: aquariumAssets.backgrounds.deepLagoon,
      coralGarden: aquariumAssets.backgrounds.coralGarden,
      moonReef: aquariumAssets.backgrounds.moonlitReef,
      sunkenTemple: aquariumAssets.backgrounds.sunkenTemple,
      tropicalRiver: aquariumAssets.backgrounds.tropicalRiver,
      nightCove: aquariumAssets.backgrounds.nightGrotto
    },
    previews: {
      deepLagoon: aquariumAssets.backgrounds.deepLagoon,
      coralGarden: aquariumAssets.backgrounds.coralGarden,
      moonReef: aquariumAssets.backgrounds.moonlitReef,
      sunkenTemple: aquariumAssets.backgrounds.sunkenTemple,
      tropicalRiver: aquariumAssets.backgrounds.tropicalRiver,
      nightCove: aquariumAssets.backgrounds.nightGrotto
    }
  }
} as const;

export const fishSpeciesAsset: Record<FishSpecies, string> = {
  GUPPY: fishImageBySpecies.GUPPY,
  GOLDFISH: fishImageBySpecies.GOLDFISH,
  BETTA: fishImageBySpecies.BETTA,
  NEON_TETRA: fishImageBySpecies.NEON_TETRA,
  ANGELFISH: fishImageBySpecies.ANGELFISH,
  DISCUS: fishImageBySpecies.DISCUS,
  MANDARINFISH: fishImageBySpecies.MANDARINFISH,
  DRAGON_KOI: fishImageBySpecies.DRAGON_KOI
};

export function fishVisualAsset(fish: { species: FishSpecies; hybridKey?: string | null }) {
  return fish.hybridKey && !fish.hybridKey.endsWith("-pure") ? aquariumAssets.breeding.hybrid(fish.hybridKey) : fishSpeciesAsset[fish.species];
}

export type ShopCategory = "fish" | "care" | "breeding" | "decor" | "backgrounds";

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
  { id: "breeding", title: "РџРёС‚РѕРјРЅРёРє", subtitle: "Р Р°Р·РІРµРґРµРЅРёРµ Рё СЂРѕСЃС‚", image: aquariumAssets.breeding.spawningNest, accent: "#F5B94E" },
  { id: "care", title: "РљРѕСЂРј", subtitle: "Р•РґР° Рё РѕС‡РёСЃС‚РєР°", image: AppAssets.shop.careFood, accent: "#E5B74F" },
  { id: "decor", title: "Р”РµРєРѕСЂ", subtitle: "Р’РѕРґРѕСЂРѕСЃР»Рё Рё РїСѓР·С‹СЂРё", image: AppAssets.shop.decorRuins, accent: "#62D4AC" },
  { id: "backgrounds", title: "Р¤РѕРЅС‹", subtitle: "Р’РёРґ Р°РєРІР°СЂРёСѓРјР°", image: AppAssets.shop.aquariumDisplay, accent: "#9B7BEF" },
  { id: "fish", title: "Р С‹Р±РєРё", subtitle: " Рё СЂРµРґРєРѕСЃС‚СЊ", image: AppAssets.shop.caseChest, accent: "#49C7E8" }
];

export const shopProducts: ShopProduct[] = [
  { id: "spawning-nest", title: "РќРµСЂРµСЃС‚РѕРІРѕРµ РіРЅРµР·РґРѕ", category: "breeding", price: 120, image: AppAssets.care.spawningNest, description: "РћР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ РїСЂРµРґРјРµС‚ РґР»СЏ Р·Р°РїСѓСЃРєР° РѕРґРЅРѕРіРѕ СЃРєСЂРµС‰РёРІР°РЅРёСЏ.", accent: "#F5B94E", status: "+1 Р·Р°РїСѓСЃРє", repeatable: true },
  { id: "fry-food", title: "РљРѕСЂРј РґР»СЏ РјР°Р»С‹С€РµР№", category: "breeding", price: 55, image: AppAssets.care.fryFood, description: "РЈСЃРєРѕСЂСЏРµС‚ РІР·СЂРѕСЃР»РµРЅРёРµ РјР°Р»СЊРєР° РёР»Рё РјР°Р»С‹С€Р° РЅР° 2 С‡Р°СЃР°. Р”Рѕ 3 СЂР°Р· РЅР° РїСЂРѕС†РµСЃСЃ.", accent: "#65E7AC", status: "в€’2 С‡Р°СЃР°", repeatable: true },
  { id: "egg-incubator", title: "РРЅРєСѓР±Р°С‚РѕСЂ РёРєСЂС‹", category: "breeding", price: 90, image: AppAssets.care.eggIncubator, description: "РџСЂРµРґРјРµС‚ РїРёС‚РѕРјРЅРёРєР° РґР»СЏ Р±СѓРґСѓС‰РёС… СѓР»СѓС‡С€РµРЅРёР№ РёРЅРєСѓР±Р°С†РёРё.", accent: "#41D9EA", repeatable: true },
  { id: "nursery-conditioner", title: "РљРѕРЅРґРёС†РёРѕРЅРµСЂ РїРёС‚РѕРјРЅРёРєР°", category: "breeding", price: 65, image: AppAssets.care.nurseryConditioner, description: "Р—Р°РїР°СЃ СЃСЂРµРґСЃС‚РІР° РґР»СЏ Р±РµР·РѕРїР°СЃРЅРѕРіРѕ СѓС…РѕРґР° Р·Р° РјРѕР»РѕРґРЅСЏРєРѕРј.", accent: "#62D4AC", repeatable: true },
  { id: "genealogy-medallion", title: "РњРµРґР°Р»СЊРѕРЅ СЂРѕРґРѕСЃР»РѕРІРЅРѕР№", category: "breeding", price: 150, image: AppAssets.care.genealogyMedallion, description: "РЎРѕС…СЂР°РЅСЏРµС‚ РґРѕСЃС‚СѓРї Рє СЂР°СЃС€РёСЂРµРЅРЅРѕР№ СЂРѕРґРѕСЃР»РѕРІРЅРѕР№ РіРёР±СЂРёРґРѕРІ.", accent: "#A78BFA", repeatable: true },
  { id: "big-water-cleaner", title: "Р‘РѕР»СЊС€РѕР№ РѕС‡РёСЃС‚РёС‚РµР»СЊ", category: "care", price: 150, image: AppAssets.care.waterConditioner, description: "РњРѕРјРµРЅС‚Р°Р»СЊРЅРѕ РѕС‡РёС‰Р°РµС‚ РІРµСЃСЊ Р°РєРІР°СЂРёСѓРј РїРѕСЃР»Рµ РїРѕРєСѓРїРєРё.", accent: "#41D9EA", status: "РїРѕР»РЅР°СЏ РѕС‡РёСЃС‚РєР°", repeatable: true },
  { id: "fish-case", title: "Р С‹Р±РєРё", category: "fish", price: 100, image: AppAssets.shop.caseChest, description: "РћС‚РєСЂС‹РІР°РµС‚ РєР°Р·РёРЅРѕ  СЃ СЂС‹Р±РєР°РјРё Рё РїСЂРёР·Р°РјРё.", accent: "#49C7E8", status: "кейс", repeatable: true },
  { id: "food-basic", title: "РћР±С‹С‡РЅС‹Р№ РєРѕСЂРј", category: "care", price: 10, image: AppAssets.care.foodBasic, description: "+10 РєРѕСЂРјР° РґР»СЏ РµР¶РµРґРЅРµРІРЅРѕРіРѕ СѓС…РѕРґР°.", accent: "#E5B74F", status: "+10", repeatable: true },
  { id: "food-premium", title: "РЈР»СѓС‡С€РµРЅРЅС‹Р№ РєРѕСЂРј", category: "care", price: 30, image: AppAssets.care.foodPremium, description: "РџСЂРµРјРёР°Р»СЊРЅР°СЏ РїРѕСЂС†РёСЏ РєРѕСЂРјР°. РЎРµР№С‡Р°СЃ РґРѕР±Р°РІР»СЏРµС‚ +25 РєРѕСЂРјР°.", accent: "#E5B74F", status: "+25", repeatable: true },
  { id: "food-large", title: "Р‘РѕР»СЊС€РѕР№ РєРѕСЂРј", category: "care", price: 35, image: AppAssets.care.foodPremium, description: "РћРґРЅР° РїРѕСЂС†РёСЏ СЃРЅРёР¶Р°РµС‚ РіРѕР»РѕРґ РІС‹Р±СЂР°РЅРЅРѕР№ СЂС‹Р±С‹ РЅР° 100.", accent: "#F5B94E", status: "в€’100 РіРѕР»РѕРґР°", repeatable: true },
  { id: "food-aquarium", title: "РЎСѓРїРµСЂРєРѕСЂРј", category: "care", price: 120, image: AppAssets.care.foodPremium, description: "РћРґРЅРѕР№ РїРѕСЂС†РёРµР№ РїРѕР»РЅРѕСЃС‚СЊСЋ РєРѕСЂРјРёС‚ РІСЃРµС… СЂС‹Р± Р°РєРІР°СЂРёСѓРјР°.", accent: "#65E7AC", status: "РІСЃРµРј СЂС‹Р±Р°Рј", repeatable: true },
      { id: "water-conditioner", title: "РћС‡РёСЃС‚РёС‚РµР»СЊ РІРѕРґС‹", category: "care", price: 45, image: AppAssets.care.waterConditioner, description: "РЎСЂРµРґСЃС‚РІРѕ РѕС‡РёСЃС‚РєРё СѓР±РёСЂР°РµС‚ Р·Р°РіСЂСЏР·РЅРµРЅРёРµ РІ Р°РєРІР°СЂРёСѓРјРµ.", accent: "#62D4AC", status: "РѕС‡РёСЃС‚РєР°", repeatable: true },
  { id: "plant-small", title: "РњР°Р»РѕРµ СЂР°СЃС‚РµРЅРёРµ", category: "decor", price: 35, image: AppAssets.decor.plantSmall, description: "РљРѕРјРїР°РєС‚РЅР°СЏ Р·РµР»РµРЅСЊ Сѓ РґРЅР° Р°РєРІР°СЂРёСѓРјР°.", accent: "#62D4AC", repeatable: false },
  { id: "plant-tall", title: "Р’С‹СЃРѕРєРѕРµ СЂР°СЃС‚РµРЅРёРµ", category: "decor", price: 55, image: AppAssets.decor.plantTall, description: "Р’С‹СЃРѕРєРѕРµ СЂР°СЃС‚РµРЅРёРµ РґР»СЏ РіР»СѓР±РёРЅС‹ СЃС†РµРЅС‹.", accent: "#62D4AC", repeatable: false },
  { id: "coral-red", title: "РљСЂР°СЃРЅС‹Р№ РєРѕСЂР°Р»Р»", category: "decor", price: 70, image: AppAssets.decor.coralRed, description: "РўС‘РїР»С‹Р№ РєРѕСЂР°Р»Р» СЃ РјСЏРіРєРёРј СЃРІРµС‡РµРЅРёРµРј.", accent: "#FF7FA3", repeatable: false },
  { id: "coral-purple", title: "Р¤РёРѕР»РµС‚РѕРІС‹Р№ РєРѕСЂР°Р»Р»", category: "decor", price: 70, image: AppAssets.decor.coralPurple, description: "Р¤РёРѕР»РµС‚РѕРІС‹Р№ Р°РєС†РµРЅС‚ РґР»СЏ РїСЂР°РІРѕР№ С‡Р°СЃС‚Рё Р°РєРІР°СЂРёСѓРјР°.", accent: "#9B7BEF", repeatable: false },
  { id: "stone-bridge", title: "РљР°РјРµРЅРЅС‹Р№ РјРѕСЃС‚", category: "decor", price: 120, image: AppAssets.decor.stoneBridge, description: "Р¦РµРЅС‚СЂР°Р»СЊРЅС‹Р№ РґРµРєРѕСЂР°С‚РёРІРЅС‹Р№ РјРѕСЃС‚.", accent: "#62D4AC", repeatable: false },
  { id: "lantern", title: "Р¤РѕРЅР°СЂСЊ", category: "decor", price: 95, image: AppAssets.decor.lantern, description: "РўС‘РїР»С‹Р№ СЃРІРµС‚ Сѓ РґРЅР° Р°РєРІР°СЂРёСѓРјР°.", accent: "#E5B74F", repeatable: false },
    { id: "seaweed-grove", title: "Р—РµР»С‘РЅС‹Рµ РІРѕРґРѕСЂРѕСЃР»Рё", category: "decor", price: 60, image: AppAssets.decor.plantTall, description: "РџС‹С€РЅС‹Рµ РІРѕРґРѕСЂРѕСЃР»Рё РґР»СЏ РЅРёР¶РЅРµРіРѕ СЃР»РѕСЏ Р°РєРІР°СЂРёСѓРјР°.", accent: "#62D4AC", repeatable: false },
    { id: "glow-seaweed", title: "РЎРІРµС‚СЏС‰РёРµСЃСЏ РІРѕРґРѕСЂРѕСЃР»Рё", category: "decor", price: 90, image: AppAssets.decor.plantSmall, description: "РњСЏРіРєРѕРµ Р·РµР»С‘РЅРѕРµ СЃРІРµС‡РµРЅРёРµ Рё Р¶РёРІРѕР№ Р°РєС†РµРЅС‚ Сѓ РґРЅР°.", accent: "#7DDC8A", repeatable: false },
    { id: "bubble-cannon", title: "РџСѓС€РєР° РїСѓР·С‹СЂСЊРєРѕРІ", category: "decor", price: 130, image: AppAssets.equipment.aerator, description: "Р”Р°С‘С‚ РїР»РѕС‚РЅС‹Р№ РїРѕС‚РѕРє РїСѓР·С‹СЂРµР№ РІ Р°РєРІР°СЂРёСѓРјРµ.", accent: "#49C7E8", status: "РїСѓР·С‹СЂРё", repeatable: false },
    { id: "double-bubble-cannon", title: "Р”РІРѕР№РЅР°СЏ РїСѓС€РєР°", category: "decor", price: 190, image: AppAssets.equipment.airPump, description: "Р”РІРµ СЃС‚СЂСѓРё РїСѓР·С‹СЂСЊРєРѕРІ РґР»СЏ Р°РєС‚РёРІРЅРѕРіРѕ Р°РєРІР°СЂРёСѓРјР°.", accent: "#9B7BEF", status: "РјРЅРѕРіРѕ", repeatable: false },
  { id: "amphora", title: "РђРјС„РѕСЂР°", category: "decor", price: 85, image: AppAssets.decor.amphora, description: "Р—Р°С‚РѕРЅСѓРІС€Р°СЏ Р°РјС„РѕСЂР° РґР»СЏ РЅРёР¶РЅРµРіРѕ СЃР»РѕСЏ.", accent: "#E5B74F", repeatable: false },
  { id: "deep-lagoon", title: "Р“Р»СѓР±РѕРєР°СЏ Р»Р°РіСѓРЅР°", category: "backgrounds", price: 150, image: AppAssets.backgrounds.previews.deepLagoon, fullImage: AppAssets.backgrounds.full.deepLagoon, description: "Р‘Р°Р·РѕРІС‹Р№ РіР»СѓР±РѕРєРёР№ СЃРёРЅРёР№ С„РѕРЅ.", accent: "#49C7E8", repeatable: false },
  { id: "coral-garden", title: "РљРѕСЂР°Р»Р»РѕРІС‹Р№ СЃР°Рґ", category: "backgrounds", price: 180, image: AppAssets.backgrounds.previews.coralGarden, fullImage: AppAssets.backgrounds.full.coralGarden, description: "Р‘РѕР»СЊС€Рµ РєСЂР°СЃРѕРє Рё РєРѕСЂР°Р»Р»РѕРІ РЅР° Р·Р°РґРЅРµРј РїР»Р°РЅРµ.", accent: "#FF7FA3", repeatable: false },
  { id: "moon-reef", title: "Р›СѓРЅРЅС‹Р№ СЂРёС„", category: "backgrounds", price: 190, image: AppAssets.backgrounds.previews.moonReef, fullImage: AppAssets.backgrounds.full.moonReef, description: "РЎРїРѕРєРѕР№РЅС‹Р№ СЂРёС„ СЃ РїСЂРѕС…Р»Р°РґРЅС‹Рј СЃРІРµС‡РµРЅРёРµРј.", accent: "#9B7BEF", repeatable: false },
  { id: "sunken-temple", title: "Р—Р°С‚РѕРЅСѓРІС€РёР№ С…СЂР°Рј", category: "backgrounds", price: 220, image: AppAssets.backgrounds.previews.sunkenTemple, fullImage: AppAssets.backgrounds.full.sunkenTemple, description: "Р”СЂР°РјР°С‚РёС‡РЅС‹Р№ С„РѕРЅ СЃ РґСЂРµРІРЅРёРјРё РґРµС‚Р°Р»СЏРјРё.", accent: "#E5B74F", repeatable: false },
  { id: "tropical-river", title: "РўСЂРѕРїРёС‡РµСЃРєР°СЏ СЂРµРєР°", category: "backgrounds", price: 210, image: AppAssets.backgrounds.previews.tropicalRiver, fullImage: AppAssets.backgrounds.full.tropicalRiver, description: "Р—РµР»С‘РЅР°СЏ РІРѕРґР° Рё РјСЏРіРєРёР№ РїСЂРёСЂРѕРґРЅС‹Р№ СЃРІРµС‚.", accent: "#62D4AC", repeatable: false },
  { id: "night-cove", title: "РќРѕС‡РЅРѕР№ РіСЂРѕС‚", category: "backgrounds", price: 210, image: AppAssets.backgrounds.previews.nightCove, fullImage: AppAssets.backgrounds.full.nightCove, description: "РўС‘РјРЅС‹Р№ С„РѕРЅ СЃ РЅРѕС‡РЅРѕР№ РіР»СѓР±РёРЅРѕР№.", accent: "#9B7BEF", repeatable: false }
];

export const shopProductsById = Object.fromEntries(shopProducts.map((product) => [product.id, product])) as Record<string, ShopProduct>;

export const backgroundImageById = Object.fromEntries(
  shopProducts.filter((product) => product.category === "backgrounds").map((product) => [product.id, product.fullImage ?? product.image])
) as Record<string, string>;

export const decorProducts = shopProducts.filter((product) => product.category === "decor");
export const decorImageById = Object.fromEntries(decorProducts.map((product) => [product.id, product.image])) as Record<string, string>;
