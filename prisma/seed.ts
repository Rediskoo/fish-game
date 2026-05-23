import { PrismaClient, FishSpecies, Rarity } from "@prisma/client";

const prisma = new PrismaClient();

const rarityConfig = {
  COMMON: { chance: 7000, income: 1, speed: 58, glow: "#9ee7ff", hunger: 1, maxHunger: 100, xp: 10 },
  RARE: { chance: 2200, income: 1.8, speed: 72, glow: "#63ffb3", hunger: 1, maxHunger: 120, xp: 25 },
  EPIC: { chance: 700, income: 3.4, speed: 88, glow: "#b987ff", hunger: 2, maxHunger: 150, xp: 55 },
  LEGENDARY: { chance: 100, income: 7, speed: 108, glow: "#ffd166", hunger: 2, maxHunger: 200, xp: 120 }
} satisfies Record<Rarity, { chance: number; income: number; speed: number; glow: string; hunger: number; maxHunger: number; xp: number }>;

const species = [
  { species: FishSpecies.GOLDFISH, displayName: "Goldfish", color: "#ffb02e" },
  { species: FishSpecies.GUPPY, displayName: "Guppy", color: "#67e8f9" },
  { species: FishSpecies.BETTA, displayName: "Betta", color: "#f472b6" },
  { species: FishSpecies.NEON_TETRA, displayName: "Neon Tetra", color: "#38bdf8" },
  { species: FishSpecies.ANGELFISH, displayName: "Angelfish", color: "#f8fafc" }
];

async function main() {
  for (const fish of species) {
    for (const rarity of Object.values(Rarity)) {
      const config = rarityConfig[rarity];
      await prisma.fishType.upsert({
        where: { species_rarity: { species: fish.species, rarity } },
        create: {
          species: fish.species,
          rarity,
          displayName: `${rarity[0]}${rarity.slice(1).toLowerCase()} ${fish.displayName}`,
          dropChanceBps: config.chance,
          incomePerSecond: config.income,
          swimSpeed: config.speed,
          hungerPerMinute: config.hunger,
          maxHunger: config.maxHunger,
          experienceReward: config.xp,
          color: fish.color,
          glowColor: config.glow
        },
        update: {
          dropChanceBps: config.chance,
          incomePerSecond: config.income,
          swimSpeed: config.speed,
          hungerPerMinute: config.hunger,
          maxHunger: config.maxHunger,
          experienceReward: config.xp,
          color: fish.color,
          glowColor: config.glow
        }
      });
    }
  }

  await prisma.achievement.upsert({
    where: { key: "first_school" },
    create: {
      key: "first_school",
      title: "First School",
      description: "Own 5 fish.",
      reward: 50
    },
    update: {}
  });

  await prisma.achievement.upsert({
    where: { key: "algae_banker" },
    create: {
      key: "algae_banker",
      title: "Algae Banker",
      description: "Reach 1000 algae.",
      reward: 100
    },
    update: {}
  });
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
