import { TransactionType, type PrismaClient } from "@prisma/client";
import { fishToView } from "@/server/services/fish.service";
import { ensureLatestSchema } from "@/server/services/schema-compat.service";
import { calculateHunger } from "@/lib/game-mechanics";
import { shopProductsById } from "@/lib/app-assets";

function stringArray(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function ownedItems(value: unknown) { return [...new Set(["deep-lagoon", ...stringArray(value)])]; }

export class SharedAquariumService {
  constructor(private readonly db: PrismaClient) {}

  async getState(userId: string) {
    await ensureLatestSchema(this.db);
    const aquariums = await this.db.sharedAquarium.findMany({ where: { OR: [{ memberAId: userId }, { memberBId: userId }] }, include: { memberA: true, memberB: true, fish: { where: { isGiftLocked: false }, include: { fishType: true }, orderBy: { createdAt: "asc" } } }, orderBy: { updatedAt: "desc" } });
    const now = new Date();
    return Promise.all(aquariums.map(async (aquarium) => {
      const friend = aquarium.memberAId === userId ? aquarium.memberB : aquarium.memberA;
      const pollutionHours = Math.floor((now.getTime() - aquarium.lastPollutionAt.getTime()) / 3_600_000);
      const pollution = Math.min(100, aquarium.pollution + Math.max(0, pollutionHours));
      const fish = aquarium.fish.map((item) => {
        const elapsedMinutes = Math.floor((now.getTime() - item.hungerUpdatedAt.getTime()) / 60_000);
        const hunger = calculateHunger(item.hunger, item.fishType.maxHunger, item.fishType.hungerPerMinute, elapsedMinutes);
        return { ...item, hunger, hungerUpdatedAt: elapsedMinutes > 0 ? now : item.hungerUpdatedAt };
      });
      if (pollution !== aquarium.pollution) await this.db.sharedAquarium.update({ where: { id: aquarium.id }, data: { pollution, lastPollutionAt: now } });
      await Promise.all(fish.filter((item, index) => item.hunger !== aquarium.fish[index].hunger).map((item) => this.db.fish.update({ where: { id: item.id }, data: { hunger: item.hunger, hungerUpdatedAt: item.hungerUpdatedAt } })));
      return { id: aquarium.id, friendId: friend.id, friendName: friend.profileName ?? friend.firstName ?? friend.username ?? "Друг", name: aquarium.name, pollution, backgroundId: aquarium.backgroundId, decor: stringArray(aquarium.decor), ownedItemIds: ownedItems(aquarium.ownedItemIds), fish: fish.map(fishToView) };
    }));
  }

  async act(userId: string, input: { aquariumId: string; action: "feed" | "clean" | "rename" | "customize"; fishId?: string; name?: string; itemId?: string }) {
    await ensureLatestSchema(this.db);
    await this.db.$transaction(async (tx) => {
      const aquarium = await tx.sharedAquarium.findFirst({ where: { id: input.aquariumId, OR: [{ memberAId: userId }, { memberBId: userId }] } });
      if (!aquarium) throw new Error("Общий аквариум не найден");
      if (input.action === "rename") {
        const name = input.name?.trim().slice(0, 18);
        if (!name || !input.fishId) throw new Error("Введите имя рыбы");
        const fish = await tx.fish.findFirst({ where: { id: input.fishId, sharedAquariumId: aquarium.id } });
        if (!fish) throw new Error("Рыба не найдена в общем аквариуме");
        await tx.fish.update({ where: { id: fish.id }, data: { name } });
        return;
      }
      if (input.action === "customize") {
        const product = input.itemId ? shopProductsById[input.itemId] : null;
        if (!product || !["decor", "backgrounds"].includes(product.category)) throw new Error("Предмет оформления не найден");
        const owned = ownedItems(aquarium.ownedItemIds); const decor = stringArray(aquarium.decor);
        if (!owned.includes(product.id)) {
          const charged = await tx.user.updateMany({ where: { id: userId, currency: { gte: product.price } }, data: { currency: { decrement: product.price } } });
          if (charged.count !== 1) throw new Error("Недостаточно водорослей");
          owned.push(product.id);
          await tx.transaction.create({ data: { ownerId: userId, type: TransactionType.PURCHASE_ITEM, amount: -product.price, metadata: { sharedAquariumId: aquarium.id, itemId: product.id } } });
        }
        const data = product.category === "backgrounds" ? { backgroundId: product.id, ownedItemIds: owned } : { decor: decor.includes(product.id) ? decor.filter((id) => id !== product.id) : [...decor, product.id].slice(-8), ownedItemIds: owned };
        await tx.sharedAquarium.update({ where: { id: aquarium.id }, data });
        return;
      }
      const inventory = await tx.inventory.findUniqueOrThrow({ where: { ownerId: userId } });
      if (input.action === "feed") {
        if (inventory.food < 1) throw new Error("Нужна одна порция обычного корма");
        await tx.inventory.update({ where: { ownerId: userId }, data: { food: { decrement: 1 } } });
        await tx.fish.updateMany({ where: { sharedAquariumId: aquarium.id }, data: { hunger: 0, hungerUpdatedAt: new Date() } });
      } else {
        if (inventory.cleaner < 1) throw new Error("Нужен очиститель воды");
        await tx.inventory.update({ where: { ownerId: userId }, data: { cleaner: { decrement: 1 } } });
        await tx.sharedAquarium.update({ where: { id: aquarium.id }, data: { pollution: 0, lastPollutionAt: new Date() } });
      }
      await tx.transaction.create({ data: { ownerId: userId, type: TransactionType.FEED, amount: -1, metadata: { sharedAquariumId: aquarium.id, action: input.action } } });
    }, { isolationLevel: "Serializable" });
    return this.getState(userId);
  }
}
