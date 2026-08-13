import { TransactionType, type PrismaClient } from "@prisma/client";
import { applyHungerDecay } from "@/server/services/hunger.service";
import { evaluateAchievements } from "@/server/services/rewards.service";

export class InventoryService {
  constructor(private readonly db: PrismaClient) {}

  async feedFish(userId: string, input: { fishId?: string; foodType: "basic" | "large" | "aquarium"; quantity: number }) {
    return this.db.$transaction(async (tx) => {
      await applyHungerDecay(tx, userId);

      const inventory = await tx.inventory.findUniqueOrThrow({ where: { ownerId: userId } });
      const quantity = input.foodType === "basic" ? input.quantity : 1;
      if (input.foodType === "basic" && inventory.food < quantity) throw new Error("Недостаточно обычного корма");
      if (input.foodType === "large" && inventory.bigFood < 1) throw new Error("Нет большого корма");
      if (input.foodType === "aquarium" && inventory.superFood < 1) throw new Error("Нет суперкорма");
      const now = new Date();
      if (input.foodType === "aquarium") {
        await tx.fish.updateMany({ where: { ownerId: userId, sharedAquariumId: null }, data: { hunger: 0, hungerUpdatedAt: now } });
      } else {
        const fish = await tx.fish.findFirstOrThrow({ where: { id: input.fishId, ownerId: userId, sharedAquariumId: null } });
        const reduction = input.foodType === "large" ? 100 : quantity * 25;
        await tx.fish.update({ where: { id: fish.id }, data: { hunger: Math.max(0, fish.hunger - reduction), hungerUpdatedAt: now } });
      }
      await tx.inventory.update({ where: { ownerId: userId }, data: input.foodType === "basic" ? { food: { decrement: quantity } } : input.foodType === "large" ? { bigFood: { decrement: 1 } } : { superFood: { decrement: 1 } } });
      await tx.transaction.create({
        data: { ownerId: userId, type: TransactionType.FEED, amount: -quantity, metadata: { fishId: input.fishId, foodType: input.foodType, quantity } }
      });
      await evaluateAchievements(tx, userId);

    });
  }
}
