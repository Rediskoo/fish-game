import { TransactionType, type FishType, type PrismaClient } from "@prisma/client";
import type { CaseTapeItem } from "@/types/game";
import { createOwnedFish, fishCatalogOrder, fishRarityMeta, fishToAcquiredView } from "@/server/services/fish.service";
import { evaluateAchievements } from "@/server/services/rewards.service";

export const fishCost = 100;

function pickWeighted(types: FishType[]) {
  const total = types.reduce((sum, type) => sum + type.dropChanceBps, 0);
  let roll = Math.floor(Math.random() * total);
  for (const type of types) {
    roll -= type.dropChanceBps;
    if (roll <= 0) return type;
  }
  return types[0];
}

function toTapeItem(type: FishType, key: string): CaseTapeItem {
  const meta = fishRarityMeta(type.rarity);
  return {
    key,
    displayName: type.displayName,
    rarity: type.rarity,
    rarityLabel: meta.label,
    rarityColor: meta.color,
    color: type.color,
    glowColor: type.glowColor
  };
}

export class MarketplaceService {
  constructor(private readonly db: PrismaClient) {}

  listFishTypes() {
    return this.db.fishType.findMany({
      where: { OR: fishCatalogOrder },
      orderBy: [{ rarity: "asc" }, { dropChanceBps: "desc" }]
    });
  }

  async purchaseFish(userId: string) {
    const types = await this.listFishTypes();
    const selected = pickWeighted(types);

    return this.db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.currency < fishCost) {
        throw new Error("Not enough algae");
      }

      await tx.user.update({ where: { id: userId }, data: { currency: { decrement: fishCost } } });

      const fish = await createOwnedFish(tx, userId, selected);
      await tx.transaction.create({
        data: {
          ownerId: userId,
          type: TransactionType.PURCHASE_FISH,
          amount: -fishCost,
          metadata: {
            fishId: fish.id,
            fishTypeId: selected.id,
            rarity: selected.rarity,
            experienceReward: selected.experienceReward
          }
        }
      });
      await evaluateAchievements(tx, userId);

      const winningIndex = 29;
      const tape = Array.from({ length: 42 }, (_, index) => {
        const type = index === winningIndex ? selected : types[Math.floor(Math.random() * types.length)] ?? selected;
        return toTapeItem(type, `${index}-${type.id}`);
      });

      return {
        fish: fishToAcquiredView(fish),
        tape,
        winningIndex,
        durationMs: 4800 + Math.floor(Math.random() * 900)
      };
    });
  }
}
