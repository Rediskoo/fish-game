import { TransactionType, type PrismaClient } from "@prisma/client";
import { GameRepository } from "@/server/repositories/game.repository";
import type { TelegramInitUser } from "@/lib/telegram/validate-init-data";
import type { AquariumSnapshot } from "@/types/game";
import { calculateFishIncome, claimOfflineIncome } from "@/server/services/income.service";

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
    const snapshot = await this.repo.findUserSnapshot(userId);
    if (!snapshot?.aquarium || !snapshot.inventory) {
      throw new Error("Player state is incomplete");
    }

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
      fish: snapshot.fish.map((fish) => ({
        id: fish.id,
        name: fish.name,
        ageSeconds: Math.floor((Date.now() - fish.createdAt.getTime()) / 1000),
        species: fish.fishType.species,
        rarity: fish.fishType.rarity,
        incomePerSecond: fish.fishType.incomePerSecond * fish.incomeMultiplier,
        swimSpeed: fish.swimSpeed,
        hunger: fish.hunger,
        color: fish.fishType.color,
        glowColor: fish.fishType.glowColor,
        animationState: fish.animationState
      })),
      incomePerSecond,
      offlineIncome: 0
    };
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
