import { type Prisma, type PrismaClient } from "@prisma/client";

const feedAmount = 10;

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function applyHungerDecay(db: DbClient, userId: string, now = new Date()) {
  const fish = await db.fish.findMany({
    where: { ownerId: userId },
    include: { fishType: true }
  });

  await Promise.all(
    fish.map((item) => {
      const elapsedMinutes = Math.floor((now.getTime() - item.hungerUpdatedAt.getTime()) / 60000);
      if (elapsedMinutes <= 0) return Promise.resolve();

      const hunger = Math.min(item.fishType.maxHunger, item.hunger + elapsedMinutes * item.fishType.hungerPerMinute);
      return db.fish.update({
        where: { id: item.id },
        data: { hunger, hungerUpdatedAt: now }
      });
    })
  );
}

export function feedFishHunger(currentHunger: number) {
  return Math.max(0, currentHunger - feedAmount);
}
