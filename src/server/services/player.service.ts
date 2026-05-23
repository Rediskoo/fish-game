import { FishSpecies, Rarity, TransactionType, type PrismaClient } from "@prisma/client";
import { GameRepository } from "@/server/repositories/game.repository";
import type { TelegramInitUser } from "@/lib/telegram/validate-init-data";
import type { AquariumSnapshot } from "@/types/game";
import { applyHungerDecay } from "@/server/services/hunger.service";
import { calculateFishIncome, claimOfflineIncome } from "@/server/services/income.service";

const dailyRewardAmount = 100;

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function nextUtcDay(date = new Date()) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export class PlayerService {
  private readonly repo: GameRepository;

  constructor(private readonly db: PrismaClient) {
    this.repo = new GameRepository(db);
  }

  async syncTelegramUser(telegramUser: TelegramInitUser) {
    let user = await this.repo.findUserByTelegramId(BigInt(telegramUser.id));

    if (!user) {
      user = await this.repo.createNewPlayer({
        telegramId: BigInt(telegramUser.id),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        photoUrl: telegramUser.photo_url
      });
    } else {
      await this.repo.updateTelegramUser(user.id, {
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        photoUrl: telegramUser.photo_url
      });
    }

    await claimOfflineIncome(this.db, user.id);
    return this.getSnapshot(user.id);
  }

  async getSnapshot(userId: string): Promise<AquariumSnapshot> {
    await applyHungerDecay(this.db, userId);
    const snapshot = await this.ensurePlayerState(userId);
    if (!snapshot?.aquarium || !snapshot.inventory) {
      throw new Error("Player state is incomplete");
    }

    const lastDailyReward = await this.db.dailyReward.findFirst({
      where: { ownerId: userId },
      orderBy: { claimedAt: "desc" }
    });
    const nextClaimAt = lastDailyReward ? nextUtcDay(lastDailyReward.claimedAt) : new Date(0);
    const claimedToday = nextClaimAt.getTime() > Date.now();

    const incomePerSecond = calculateFishIncome(snapshot.fish);
    return {
      user: {
        id: snapshot.id,
        telegramId: snapshot.telegramId.toString(),
        username: snapshot.username,
        firstName: snapshot.firstName,
        currency: snapshot.currency
      },
      aquarium: {
        id: snapshot.aquarium.id,
        name: snapshot.aquarium.name,
        level: snapshot.aquarium.level,
        experience: snapshot.aquarium.experience,
        lastIncomeAt: snapshot.aquarium.lastIncomeAt.toISOString()
      },
      inventory: { food: snapshot.inventory.food },
      dailyReward: {
        amount: dailyRewardAmount,
        claimedToday,
        nextClaimAt: nextClaimAt.toISOString()
      },
      fish: snapshot.fish.map((fish) => ({
        id: fish.id,
        name: fish.name,
        ageSeconds: Math.floor((Date.now() - fish.createdAt.getTime()) / 1000),
        species: fish.fishType.species,
        rarity: fish.fishType.rarity,
        typeName: fish.fishType.displayName,
        incomePerSecond: fish.fishType.incomePerSecond * fish.incomeMultiplier,
        swimSpeed: fish.swimSpeed,
        hunger: fish.hunger,
        maxHunger: fish.fishType.maxHunger,
        color: fish.fishType.color,
        glowColor: fish.fishType.glowColor,
        animationState: fish.animationState
      })),
      incomePerSecond,
      offlineIncome: 0
    };
  }

  private async ensurePlayerState(userId: string) {
    let snapshot = await this.repo.findUserSnapshot(userId);
    if (!snapshot) {
      throw new Error("Player not found");
    }

    if (snapshot.aquarium && snapshot.inventory && snapshot.fish.length > 0) {
      return snapshot;
    }

    const playerName = snapshot.firstName ?? "My";
    await this.db.$transaction(async (tx) => {
      const starterType = await tx.fishType.upsert({
        where: { species_rarity: { species: FishSpecies.GOLDFISH, rarity: Rarity.COMMON } },
        create: {
          species: FishSpecies.GOLDFISH,
          rarity: Rarity.COMMON,
          displayName: "Common Goldfish",
          dropChanceBps: 7000,
          incomePerSecond: 1,
          swimSpeed: 58,
          hungerPerMinute: 1,
          maxHunger: 100,
          experienceReward: 25,
          color: "#ffb02e",
          glowColor: "#9ee7ff"
        },
        update: {}
      });

      await tx.aquarium.upsert({
        where: { ownerId: userId },
        create: { ownerId: userId, name: `${playerName} Aquarium` },
        update: {}
      });

      await tx.inventory.upsert({
        where: { ownerId: userId },
        create: { ownerId: userId, food: 5 },
        update: {}
      });

      const fishCount = await tx.fish.count({ where: { ownerId: userId } });
      if (fishCount === 0) {
        await tx.fish.create({
          data: {
            ownerId: userId,
            fishTypeId: starterType.id,
            name: "Bubbles",
            swimSpeed: starterType.swimSpeed,
            animationState: { x: 0.3, y: 0.5, direction: 1 }
          }
        });
      }
    });

    snapshot = await this.repo.findUserSnapshot(userId);
    if (!snapshot) {
      throw new Error("Player not found");
    }
    return snapshot;
  }

  async buyFood(userId: string, amount: number) {
    if (amount < 1 || amount > 999) throw new Error("Invalid food amount");
    return this.db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.currency < amount) throw new Error("Not enough algae");
      await tx.user.update({ where: { id: userId }, data: { currency: { decrement: amount } } });
      await tx.inventory.update({ where: { ownerId: userId }, data: { food: { increment: amount } } });
      await tx.transaction.create({
        data: { ownerId: userId, type: TransactionType.PURCHASE_FOOD, amount: -amount, metadata: { food: amount } }
      });
    });
  }
}
