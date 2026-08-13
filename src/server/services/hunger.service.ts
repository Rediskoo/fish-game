import { type Prisma, type PrismaClient } from "@prisma/client";
import { calculateHunger, feedHunger } from "@/lib/game-mechanics";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function applyHungerDecay(db: DbClient, userId: string, now = new Date()) {
  const fish = await db.fish.findMany({
    where: { ownerId: userId, sharedAquariumId: null },
    include: { fishType: true }
  });

  await Promise.all(
    fish.map((item) => {
      const elapsedMinutes = Math.floor((now.getTime() - item.hungerUpdatedAt.getTime()) / 60000);
      if (elapsedMinutes <= 0) return Promise.resolve();

      const hunger = calculateHunger(item.hunger, item.fishType.maxHunger, item.fishType.hungerPerMinute, elapsedMinutes);
      return db.fish.update({
        where: { id: item.id },
        data: { hunger, hungerUpdatedAt: now }
      });
    })
  );
}

export function feedFishHunger(currentHunger: number) {
  return feedHunger(currentHunger);
}
