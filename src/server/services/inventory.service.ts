import { TransactionType, type PrismaClient } from "@prisma/client";
import { applyHungerDecay, feedFishHunger } from "@/server/services/hunger.service";
import { evaluateAchievements } from "@/server/services/rewards.service";

export class InventoryService {
  constructor(private readonly db: PrismaClient) {}

  async feedFish(userId: string, fishId: string) {
    return this.db.$transaction(async (tx) => {
      await applyHungerDecay(tx, userId);

      const inventory = await tx.inventory.findUniqueOrThrow({ where: { ownerId: userId } });
      if (inventory.food <= 0) throw new Error("No food in inventory");

      const fish = await tx.fish.findFirstOrThrow({ where: { id: fishId, ownerId: userId } });
      const updatedFish = await tx.fish.update({
        where: { id: fish.id },
        data: { hunger: feedFishHunger(fish.hunger), hungerUpdatedAt: new Date() },
        include: { fishType: true }
      });

      await tx.inventory.update({ where: { ownerId: userId }, data: { food: { decrement: 1 } } });
      await tx.transaction.create({
        data: { ownerId: userId, type: TransactionType.FEED, amount: -1, metadata: { fishId } }
      });
      await evaluateAchievements(tx, userId);

      return updatedFish;
    });
  }
}
