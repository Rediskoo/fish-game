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
    if (types.length === 0) throw new Error("Fish catalog is empty");
    const selected = [pickWeighted(types), pickWeighted(types), pickWeighted(types)] as const;
    const matchingSymbols = new Set(selected.map((type) => type.id)).size;

    return this.db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.currency < fishCost) {
        throw new Error("Not enough algae");
      }

      await tx.user.update({ where: { id: userId }, data: { currency: { decrement: fishCost } } });

      const reward = matchingSymbols === 1
        ? { kind: "fish" as const, fish: await createOwnedFish(tx, userId, selected[0]) }
        : { kind: "currency" as const, amount: matchingSymbols === 2 ? 100 : 50 };

      if (reward.kind === "currency") {
        await tx.user.update({ where: { id: userId }, data: { currency: { increment: reward.amount } } });
      }
      await tx.transaction.create({
        data: {
          ownerId: userId,
          type: TransactionType.PURCHASE_FISH,
          amount: -fishCost + (reward.kind === "currency" ? reward.amount : 0),
          metadata: {
            symbols: selected.map((type) => type.id),
            reward: reward.kind,
            rewardAmount: reward.kind === "currency" ? reward.amount : null,
            fishId: reward.kind === "fish" ? reward.fish.id : null
          }
        }
      });
      await evaluateAchievements(tx, userId);

      const reels = selected.map((winningType, reelIndex) => {
        const items = Array.from({ length: 16 }, (_, index) => {
          const type = index === 15 ? winningType : pickWeighted(types);
          return toTapeItem(type, `${reelIndex}-${index}-${type.id}`);
        });
        return items;
      }) as [CaseTapeItem[], CaseTapeItem[], CaseTapeItem[]];

      return {
        reels,
        symbols: selected.map((type, index) => toTapeItem(type, `symbol-${index}-${type.id}`)) as [CaseTapeItem, CaseTapeItem, CaseTapeItem],
        reward: reward.kind === "fish" ? { kind: "fish" as const, fish: fishToAcquiredView(reward.fish) } : reward,
        durationMs: 7200 + Math.floor(Math.random() * 900)
      };
    });
  }
}
