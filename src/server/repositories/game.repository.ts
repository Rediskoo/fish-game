import type { PrismaClient } from "@prisma/client";
import { FishOrigin, FishPersonality, FishSpecies, Rarity, TransactionType } from "@prisma/client";

export class GameRepository {
  constructor(private readonly db: PrismaClient) {}

  findUserByTelegramId(telegramId: bigint) {
    return this.db.user.findUnique({
      where: { telegramId },
      include: { aquarium: true, inventory: true }
    });
  }

  findUserSnapshot(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      include: {
        aquarium: true,
        inventory: true,
        fish: {
          where: { isGiftLocked: false },
          include: { fishType: true },
          orderBy: [{ isFavorite: "desc" }, { createdAt: "asc" }]
        }
      }
    });
  }

  listFishTypes() {
    return this.db.fishType.findMany({
      orderBy: [{ rarity: "asc" }, { species: "asc" }]
    });
  }

  async createNewPlayer(input: {
    telegramId: bigint;
    username?: string;
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
  }) {
    const starterType =
      (await this.db.fishType.findFirst({
        where: { species: FishSpecies.GOLDFISH, rarity: Rarity.COMMON }
      })) ??
      (await this.db.fishType.create({
        data: {
          species: FishSpecies.GOLDFISH,
          rarity: Rarity.COMMON,
          displayName: "Золотая рыбка",
          dropChanceBps: 2500,
          incomePerSecond: 1.2,
          swimSpeed: 58,
          hungerPerMinute: 1,
          maxHunger: 100,
          experienceReward: 25,
          color: "#ffb02e",
          glowColor: "#ffd166"
        }
      }));

    return this.db.user.create({
      data: {
        telegramId: input.telegramId,
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        photoUrl: input.photoUrl,
        currency: 300,
        aquarium: { create: { name: `${input.firstName ?? "My"} Aquarium` } },
        inventory: { create: { food: 5 } },
        fish: {
          create: {
            fishTypeId: starterType.id,
            name: "Bubbles",
            swimSpeed: starterType.swimSpeed,
            personality: FishPersonality.CURIOUS,
            origin: FishOrigin.STARTER,
            animationState: { x: 0.3, y: 0.5, direction: 1 }
          }
        }
      },
      include: { aquarium: true, inventory: true }
    });
  }

  updateTelegramUser(
    userId: string,
    input: { username?: string; firstName?: string; lastName?: string; photoUrl?: string }
  ) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        photoUrl: input.photoUrl,
        lastLoginAt: new Date()
      }
    });
  }

  async addCurrency(userId: string, amount: number, type: TransactionType, metadata = {}) {
    return this.db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { currency: { increment: amount } }
      });
      await tx.transaction.create({ data: { ownerId: userId, type, amount, metadata } });
      return user;
    });
  }
}
