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
  { id: "breeding", title: "Питомник", subtitle: "Разведение и рост", image: aquariumAssets.breeding.spawningNest, accent: "#F5B94E" },
  { id: "care", title: "Корм", subtitle: "Еда и очистка", image: AppAssets.shop.careFood, accent: "#E5B74F" },
  { id: "decor", title: "Декор", subtitle: "Водоросли и пузыри", image: AppAssets.shop.decorRuins, accent: "#62D4AC" },
  { id: "backgrounds", title: "Фоны", subtitle: "Вид аквариума", image: AppAssets.shop.aquariumDisplay, accent: "#9B7BEF" },
  { id: "fish", title: "Рыбки", subtitle: " и редкость", image: AppAssets.shop.caseChest, accent: "#49C7E8" }
];

export const shopProducts: ShopProduct[] = [
  { id: "spawning-nest", title: "Нерестовое гнездо", category: "breeding", price: 120, image: AppAssets.care.spawningNest, description: "Обязательный предмет для запуска одного скрещивания.", accent: "#F5B94E", status: "+1 запуск", repeatable: true },
  { id: "fry-food", title: "Корм для малышей", category: "breeding", price: 55, image: AppAssets.care.fryFood, description: "Ускоряет взросление малька или малыша на 2 часа. До 3 раз на процесс.", accent: "#65E7AC", status: "−2 часа", repeatable: true },
  { id: "egg-incubator", title: "РРЅРєСѓР±Р°С‚РѕСЂ икры", category: "breeding", price: 90, image: AppAssets.care.eggIncubator, description: "Предмет питомника для будущих улучшений инкубации.", accent: "#41D9EA", repeatable: true },
  { id: "nursery-conditioner", title: "Кондиционер питомника", category: "breeding", price: 65, image: AppAssets.care.nurseryConditioner, description: "Запас средства для безопасного ухода за молодняком.", accent: "#62D4AC", repeatable: true },
  { id: "genealogy-medallion", title: "Медальон родословной", category: "breeding", price: 150, image: AppAssets.care.genealogyMedallion, description: "Сохраняет доступ к расширенной родословной гибридов.", accent: "#A78BFA", repeatable: true },
  { id: "big-water-cleaner", title: "Большой очиститель", category: "care", price: 150, image: AppAssets.care.waterConditioner, description: "Моментально очищает весь аквариум после покупки.", accent: "#41D9EA", status: "полная очистка", repeatable: true },
  { id: "fish-case", title: "Рыбки", category: "fish", price: 100, image: AppAssets.shop.caseChest, description: "Открывает казино  с рыбками и призами.", accent: "#49C7E8", status: "кейс", repeatable: true },
  { id: "food-basic", title: "Обычный корм", category: "care", price: 10, image: AppAssets.care.foodBasic, description: "+10 корма для ежедневного ухода.", accent: "#E5B74F", status: "+10", repeatable: true },
  { id: "food-premium", title: "Улучшенный корм", category: "care", price: 30, image: AppAssets.care.foodPremium, description: "Премиальная порция корма. Сейчас добавляет +25 корма.", accent: "#E5B74F", status: "+25", repeatable: true },
  { id: "food-large", title: "Большой корм", category: "care", price: 35, image: AppAssets.care.foodPremium, description: "Одна порция снижает голод выбранной рыбы на 100.", accent: "#F5B94E", status: "−100 голода", repeatable: true },
  { id: "food-aquarium", title: "Суперкорм", category: "care", price: 120, image: AppAssets.care.foodPremium, description: "Одной порцией полностью кормит всех рыб аквариума.", accent: "#65E7AC", status: "всем рыбам", repeatable: true },
      { id: "water-conditioner", title: "Очиститель воды", category: "care", price: 45, image: AppAssets.care.waterConditioner, description: "Средство очистки убирает загрязнение в аквариуме.", accent: "#62D4AC", status: "очистка", repeatable: true },
  { id: "plant-small", title: "Малое растение", category: "decor", price: 35, image: AppAssets.decor.plantSmall, description: "Компактная зелень у дна аквариума.", accent: "#62D4AC", repeatable: false },
  { id: "plant-tall", title: "Высокое растение", category: "decor", price: 55, image: AppAssets.decor.plantTall, description: "Высокое растение для глубины сцены.", accent: "#62D4AC", repeatable: false },
  { id: "coral-red", title: "Красный коралл", category: "decor", price: 70, image: AppAssets.decor.coralRed, description: "Тёплый коралл с мягким свечением.", accent: "#FF7FA3", repeatable: false },
  { id: "coral-purple", title: "Фиолетовый коралл", category: "decor", price: 70, image: AppAssets.decor.coralPurple, description: "Фиолетовый акцент для правой части аквариума.", accent: "#9B7BEF", repeatable: false },
  { id: "stone-bridge", title: "Каменный мост", category: "decor", price: 120, image: AppAssets.decor.stoneBridge, description: "Центральный декоративный мост.", accent: "#62D4AC", repeatable: false },
  { id: "lantern", title: "Фонарь", category: "decor", price: 95, image: AppAssets.decor.lantern, description: "Тёплый свет у дна аквариума.", accent: "#E5B74F", repeatable: false },
    { id: "seaweed-grove", title: "Зелёные водоросли", category: "decor", price: 60, image: AppAssets.decor.plantTall, description: "Пышные водоросли для нижнего слоя аквариума.", accent: "#62D4AC", repeatable: false },
    { id: "glow-seaweed", title: "Светящиеся водоросли", category: "decor", price: 90, image: AppAssets.decor.plantSmall, description: "Мягкое зелёное свечение и живой акцент у дна.", accent: "#7DDC8A", repeatable: false },
    { id: "bubble-cannon", title: "Пушка пузырьков", category: "decor", price: 130, image: AppAssets.equipment.aerator, description: "Даёт плотный поток пузырей в аквариуме.", accent: "#49C7E8", status: "пузыри", repeatable: false },
    { id: "double-bubble-cannon", title: "Двойная пушка", category: "decor", price: 190, image: AppAssets.equipment.airPump, description: "Две струи пузырьков для активного аквариума.", accent: "#9B7BEF", status: "много", repeatable: false },
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
