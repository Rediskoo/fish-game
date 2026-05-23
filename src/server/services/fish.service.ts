import { TransactionType, type Fish, type FishType, type Prisma, type PrismaClient } from "@prisma/client";
import type { AcquiredFish, FishView } from "@/types/game";

export const fishSalePrice = 50;

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

export function fishToView(fish: Fish & { fishType: FishType }): FishView {
  return {
    id: fish.id,
    name: fish.name,
    ageSeconds: Math.floor((Date.now() - fish.createdAt.getTime()) / 1000),
    species: fish.fishType.species,
    rarity: fish.fishType.rarity,
    typeName: fish.fishType.displayName,
    incomePerSecond: fish.fishType.incomePerSecond * fish.incomeMultiplier,
    swimSpeed: fish.swimSpeed,
    hunger: fish.hunger,
    maxHunger: fish.fishType.maxHunger,
    color: fish.fishType.color,
    glowColor: fish.fishType.glowColor,
    animationState: fish.animationState
  };
}

export function fishAcquisitionMessage(fishType: FishType) {
  const speciesMessages = {
    GOLDFISH: "Солнечный малыш уже ищет лучший угол аквариума.",
    GUPPY: "Шустрый хвостик принес в воду праздник.",
    BETTA: "Настоящая звезда выплыла на сцену.",
    NEON_TETRA: "Неоновая искра теперь светится у тебя.",
    ANGELFISH: "Грациозный ангел добавил аквариуму шарма."
  } satisfies Record<FishType["species"], string>;

  const rarityMessages = {
    COMMON: "Милая находка для уютной стаи.",
    RARE: "Редкий улов, который хочется рассматривать.",
    EPIC: "Эпичный заплыв начинается прямо сейчас.",
    LEGENDARY: "Легенда всплыла. Вот это удача."
  } satisfies Record<FishType["rarity"], string>;

  return `${rarityMessages[fishType.rarity]} ${speciesMessages[fishType.species]}`;
}

export function fishToAcquiredView(fish: Fish & { fishType: FishType }): AcquiredFish {
  return {
    ...fishToView(fish),
    displayName: fish.fishType.displayName,
    dropChanceBps: fish.fishType.dropChanceBps,
    message: fishAcquisitionMessage(fish.fishType)
  };
}

export class FishService {
  constructor(private readonly db: PrismaClient) {}

  async renameFish(userId: string, fishId: string, name: string) {
    const fish = await this.db.fish.findFirst({ where: { id: fishId, ownerId: userId } });
    if (!fish) throw new Error("Fish not found");
    await this.db.fish.update({ where: { id: fishId }, data: { name } });
  }

  async sellFish(userId: string, fishId: string) {
    return this.db.$transaction(async (tx) => {
      const fishCount = await tx.fish.count({ where: { ownerId: userId } });
      if (fishCount <= 1) throw new Error("You need at least one fish in the aquarium");

      const fish = await tx.fish.findFirst({ where: { id: fishId, ownerId: userId }, include: { fishType: true } });
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
