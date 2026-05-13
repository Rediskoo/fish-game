import { TransactionType, type PrismaClient } from "@prisma/client";

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export class RewardsService {
  constructor(private readonly db: PrismaClient) {}

  async claimDaily(userId: string) {
    const rewardDate = startOfUtcDay();
    const amount = 300;

    return this.db.$transaction(async (tx) => {
      const existing = await tx.dailyReward.findUnique({
        where: { ownerId_rewardDate: { ownerId: userId, rewardDate } }
      });
      if (existing) throw new Error("Daily reward already claimed");

      await tx.dailyReward.create({ data: { ownerId: userId, rewardDate, amount } });
      await tx.user.update({ where: { id: userId }, data: { currency: { increment: amount } } });
      await tx.transaction.create({
        data: { ownerId: userId, type: TransactionType.DAILY_REWARD, amount, metadata: { rewardDate } }
      });
      return { amount };
    });
  }

  listAchievements(userId: string) {
    return this.db.achievement.findMany({
      include: { users: { where: { ownerId: userId } } },
      orderBy: { createdAt: "asc" }
    });
  }
}
