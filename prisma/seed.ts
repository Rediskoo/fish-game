import { FishSpecies, PrismaClient, Rarity } from "@prisma/client";

const prisma = new PrismaClient();

const fishCatalog = [
  { species: FishSpecies.GUPPY, rarity: Rarity.COMMON, displayName: "Гуппи", chance: 4500, income: 1.0, speed: 72, color: "#67e8f9", glow: "#9ee7ff", hunger: 1, maxHunger: 100, xp: 25 },
  { species: FishSpecies.GOLDFISH, rarity: Rarity.COMMON, displayName: "Золотая рыбка", chance: 2500, income: 1.2, speed: 58, color: "#ffb02e", glow: "#ffd166", hunger: 1, maxHunger: 100, xp: 25 },
  { species: FishSpecies.BETTA, rarity: Rarity.RARE, displayName: "Петушок", chance: 1400, income: 2.0, speed: 76, color: "#f472b6", glow: "#63ffb3", hunger: 1, maxHunger: 120, xp: 50 },
  { species: FishSpecies.NEON_TETRA, rarity: Rarity.RARE, displayName: "Неоновая тетра", chance: 900, income: 2.5, speed: 92, color: "#38bdf8", glow: "#63ffb3", hunger: 1, maxHunger: 120, xp: 50 },
  { species: FishSpecies.ANGELFISH, rarity: Rarity.EPIC, displayName: "Скалярия", chance: 450, income: 4.0, speed: 68, color: "#f8fafc", glow: "#b987ff", hunger: 2, maxHunger: 150, xp: 75 },
  { species: FishSpecies.DISCUS, rarity: Rarity.EPIC, displayName: "Дискус", chance: 180, income: 5.5, speed: 62, color: "#fb7185", glow: "#b987ff", hunger: 2, maxHunger: 150, xp: 75 },
  { species: FishSpecies.MANDARINFISH, rarity: Rarity.LEGENDARY, displayName: "Мандаринка", chance: 55, income: 8.0, speed: 86, color: "#f97316", glow: "#ffd166", hunger: 2, maxHunger: 200, xp: 100 },
  { species: FishSpecies.DRAGON_KOI, rarity: Rarity.LEGENDARY, displayName: "Драконовый кои", chance: 15, income: 12.0, speed: 110, color: "#facc15", glow: "#ffd166", hunger: 2, maxHunger: 220, xp: 125 }
];

const achievements = [
  ["first_school", "Первая стайка", "Завести 5 рыб.", 50],
  ["algae_banker", "Водорослевый банк", "Накопить 1000 водорослей.", 100],
  ["case_opener", "Первый кейс", "Открыть кейс с рыбкой.", 25],
  ["rare_friend", "Редкий сосед", "Получить редкую рыбку.", 75],
  ["epic_splash", "Эпический всплеск", "Получить эпическую рыбку.", 150],
  ["legendary_luck", "Легенда в воде", "Получить легендарную рыбку.", 300],
  ["caring_owner", "Заботливый хозяин", "Покормить рыбок 25 раз.", 100],
  ["social_aquarium", "Дружеский аквариум", "Добавить первого друга.", 50],
  ["generous_gift", "Щедрый подарок", "Отправить подарок другу.", 100],
  ["collector", "Коллекционер", "Собрать все 8 видов рыб.", 250]
] as const;

async function main() {
  for (const fish of fishCatalog) {
    await prisma.fishType.upsert({
      where: { species_rarity: { species: fish.species, rarity: fish.rarity } },
      create: {
        species: fish.species,
        rarity: fish.rarity,
        displayName: fish.displayName,
        dropChanceBps: fish.chance,
        incomePerSecond: fish.income,
        swimSpeed: fish.speed,
        hungerPerMinute: fish.hunger,
        maxHunger: fish.maxHunger,
        experienceReward: fish.xp,
        color: fish.color,
        glowColor: fish.glow
      },
      update: {
        displayName: fish.displayName,
        dropChanceBps: fish.chance,
        incomePerSecond: fish.income,
        swimSpeed: fish.speed,
        hungerPerMinute: fish.hunger,
        maxHunger: fish.maxHunger,
        experienceReward: fish.xp,
        color: fish.color,
        glowColor: fish.glow
      }
    });
  }

  for (const [key, title, description, reward] of achievements) {
    await prisma.achievement.upsert({
      where: { key },
      create: { key, title, description, reward },
      update: { title, description, reward }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
