import {
  FishPersonality,
  FishSpecies,
  Rarity,
  TransactionType,
  type Fish,
  type FishType,
  type Prisma,
  type PrismaClient
} from "@prisma/client";
import type { AcquiredFish, FishView } from "@/types/game";
import type { FishGenome } from "@/features/breeding/types";

export const fishSalePrice = 50;

export const fishCatalogOrder: Array<{ species: FishSpecies; rarity: Rarity }> = [
  { species: FishSpecies.GUPPY, rarity: Rarity.COMMON },
  { species: FishSpecies.GOLDFISH, rarity: Rarity.COMMON },
  { species: FishSpecies.BETTA, rarity: Rarity.RARE },
  { species: FishSpecies.NEON_TETRA, rarity: Rarity.RARE },
  { species: FishSpecies.ANGELFISH, rarity: Rarity.EPIC },
  { species: FishSpecies.DISCUS, rarity: Rarity.EPIC },
  { species: FishSpecies.MANDARINFISH, rarity: Rarity.LEGENDARY },
  { species: FishSpecies.DRAGON_KOI, rarity: Rarity.LEGENDARY }
];

type DbClient = PrismaClient | Prisma.TransactionClient;

function calculateLevel(experience: number) {
  return Math.floor(experience / 100) + 1;
}

export async function addAquariumExperience(db: DbClient, userId: string, amount: number) {
  const aquarium = await db.aquarium.findUniqueOrThrow({ where: { ownerId: userId } });
  const nextExperience = aquarium.experience + amount;
  await db.aquarium.update({
    where: { ownerId: userId },
    data: {
      experience: { increment: amount },
      level: Math.max(aquarium.level, calculateLevel(nextExperience))
    }
  });
}

const rarityMeta = {
  COMMON: { label: "Обычная", color: "#9ee7ff" },
  RARE: { label: "Редкая", color: "#63ffb3" },
  EPIC: { label: "Эпическая", color: "#b987ff" },
  LEGENDARY: { label: "Легендарная", color: "#ffd166" }
} satisfies Record<Rarity, { label: string; color: string }>;

const personalityLabel = {
  CURIOUS: "Любопытная",
  CALM: "Спокойная",
  LAZY: "Ленивая",
  SOCIAL: "Общительная",
  SHY: "Пугливая",
  AGGRESSIVE: "Агрессивная",
  PLAYFUL: "Игривая"
} satisfies Record<FishPersonality, string>;

const personalityDescriptions = {
  CURIOUS: "Всегда первой подплывает к новому и рассматривает всё блестящее.",
  CALM: "Плывёт мягко и уверенно, будто знает тайный ритм воды.",
  LAZY: "Любит уютные уголки, долгие паузы и неспешные круги.",
  SOCIAL: "Держится ближе к стае и легко заводит водные знакомства.",
  SHY: "Осторожная малышка, но с каждым днём доверяет аквариуму больше.",
  AGGRESSIVE: "Резкая, смелая и немного драматичная звезда заплывов.",
  PLAYFUL: "Пускает настроение пузырьками и устраивает маленькие гонки."
} satisfies Record<FishPersonality, string>;

export function randomPersonality(): FishPersonality {
  const values = Object.values(FishPersonality);
  return values[Math.floor(Math.random() * values.length)] ?? FishPersonality.CURIOUS;
}

export function fishRarityMeta(rarity: Rarity) {
  return rarityMeta[rarity];
}

export function fishAcquisitionMessage(fishType: FishType) {
  const speciesMessages = {
    GUPPY: "Гуппи приносит в аквариум лёгкость и быстрые искры движения.",
    GOLDFISH: "Золотая рыбка ищет самый солнечный угол аквариума.",
    BETTA: "Петушок выплывает как маленькая водная звезда.",
    NEON_TETRA: "Неоновая тетра добавляет воде яркий световой штрих.",
    ANGELFISH: "Скалярия делает аквариум спокойнее и величественнее.",
    DISCUS: "Дискус выглядит как живой драгоценный диск.",
    MANDARINFISH: "Мандаринка переливается так, будто её раскрасил океан.",
    DRAGON_KOI: "Драконовый кои выглядит как легенда, которая решила поселиться у тебя."
  } satisfies Record<FishType["species"], string>;

  const rarityMessages = {
    COMMON: "Милая находка для уютной стаи.",
    RARE: "Редкий улов, который хочется рассматривать.",
    EPIC: "Эпичный заплыв начинается прямо сейчас.",
    LEGENDARY: "Легенда всплыла. Вот это удача."
  } satisfies Record<FishType["rarity"], string>;

  return `${rarityMessages[fishType.rarity]} ${speciesMessages[fishType.species]}`;
}

export function fishToView(fish: Fish & { fishType: FishType }): FishView {
  const meta = fishRarityMeta(fish.fishType.rarity);
  return {
    id: fish.id,
    name: fish.name,
    ageSeconds: Math.floor((Date.now() - fish.createdAt.getTime()) / 1000),
    species: fish.fishType.species,
    rarity: fish.fishType.rarity,
    typeName: fish.fishType.displayName,
    displayName: fish.fishType.displayName,
    isFavorite: fish.isFavorite,
    personality: fish.personality,
    personalityLabel: personalityLabel[fish.personality],
    birthday: fish.createdAt.toISOString(),
    description: `${personalityDescriptions[fish.personality]} ${fishAcquisitionMessage(fish.fishType)}`,
    rarityLabel: meta.label,
    rarityColor: meta.color,
    incomePerSecond: fish.fishType.incomePerSecond * fish.incomeMultiplier,
    swimSpeed: fish.swimSpeed,
    hunger: fish.hunger,
    maxHunger: fish.fishType.maxHunger,
    color: fish.fishType.color,
    glowColor: fish.fishType.glowColor,
    animationState: fish.animationState,
    lifeStage: fish.lifeStage,
    origin: fish.origin,
    genome: fish.genome as FishGenome | null,
    hybridKey: fish.hybridKey,
    parentIds: [fish.parentAId, fish.parentBId],
    breedingLocked: fish.breedingLocked
  };
}

export function fishToAcquiredView(fish: Fish & { fishType: FishType }): AcquiredFish {
  return {
    ...fishToView(fish),
    displayName: fish.fishType.displayName,
    dropChanceBps: fish.fishType.dropChanceBps,
    message: fishAcquisitionMessage(fish.fishType)
  };
}

export async function createOwnedFish(tx: Prisma.TransactionClient, userId: string, selected: FishType) {
  const fish = await tx.fish.create({
    data: {
      ownerId: userId,
      fishTypeId: selected.id,
      name: selected.displayName,
      swimSpeed: selected.swimSpeed,
      personality: randomPersonality(),
      descriptionSeed: Math.floor(Math.random() * 100000),
      animationState: { x: Math.random(), y: Math.random(), direction: Math.random() > 0.5 ? 1 : -1 }
    },
    include: { fishType: true }
  });
  await addAquariumExperience(tx, userId, selected.experienceReward);
  return fish;
}

export class FishService {
  constructor(private readonly db: PrismaClient) {}

  async updateFish(userId: string, fishId: string, input: { name?: string; isFavorite?: boolean }) {
    const fish = await this.db.fish.findFirst({ where: { id: fishId, ownerId: userId, isGiftLocked: false } });
    if (!fish) throw new Error("Fish not found");
    await this.db.fish.update({
      where: { id: fishId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(typeof input.isFavorite === "boolean" ? { isFavorite: input.isFavorite } : {})
      }
    });
  }

  async renameFish(userId: string, fishId: string, name: string) {
    await this.updateFish(userId, fishId, { name });
  }

  async sellFish(userId: string, fishId: string) {
    return this.db.$transaction(async (tx) => {
      const fishCount = await tx.fish.count({ where: { ownerId: userId, isGiftLocked: false } });
      if (fishCount <= 1) throw new Error("You need at least one fish in the aquarium");

      const fish = await tx.fish.findFirst({ where: { id: fishId, ownerId: userId, isGiftLocked: false, breedingLocked: false }, include: { fishType: true } });
      if (!fish) throw new Error("Fish not found");

      await tx.fish.delete({ where: { id: fishId } });
      await tx.user.update({ where: { id: userId }, data: { currency: { increment: fishSalePrice } } });
      await tx.transaction.create({
        data: {
          ownerId: userId,
          type: TransactionType.SELL_FISH,
          amount: fishSalePrice,
          metadata: { fishId, fishTypeId: fish.fishTypeId, rarity: fish.fishType.rarity }
        }
      });
    });
  }
}
