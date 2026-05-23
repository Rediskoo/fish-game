import { TransactionType, type FishType, type PrismaClient } from "@prisma/client";
import { addAquariumExperience, fishToAcquiredView } from "@/server/services/fish.service";

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

export class MarketplaceService {
  constructor(private readonly db: PrismaClient) {}

  listFishTypes() {
    return this.db.fishType.findMany({ orderBy: [{ rarity: "asc" }, { species: "asc" }] });
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
      await addAquariumExperience(tx, userId, selected.experienceReward);

      const fish = await tx.fish.create({
        data: {
          ownerId: userId,
          fishTypeId: selected.id,
          name: selected.displayName.split(" ").at(-1) ?? "Fish",
          swimSpeed: selected.swimSpeed,
          animationState: { x: Math.random(), y: Math.random(), direction: Math.random() > 0.5 ? 1 : -1 }
        },
        include: { fishType: true }
      });
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
      return fishToAcquiredView(fish);
    });
  }
}
