import { TransactionType, type Prisma, type PrismaClient } from "@prisma/client";

const fishSalePrice = 50;

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
