import { Prisma, Rarity, TransactionType, type PrismaClient } from "@prisma/client";

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export class RewardsService {
  constructor(private readonly db: PrismaClient) {}

  async claimDaily(userId: string) {
    const now = new Date();
    const rewardDate = startOfUtcDay();
    const amount = 100;

    return this.db.$transaction(async (tx) => {
      const lastReward = await tx.dailyReward.findFirst({
        where: { ownerId: userId },
        orderBy: { claimedAt: "desc" }
      });
      if (lastReward && now.getTime() - lastReward.claimedAt.getTime() < 24 * 60 * 60 * 1000) {
        throw new Error("Daily reward already claimed");
      }

      await tx.dailyReward.create({ data: { ownerId: userId, rewardDate, amount, claimedAt: now } });
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

type RewardsDb = PrismaClient | Prisma.TransactionClient;

async function unlockAchievement(db: RewardsDb, userId: string, key: string) {
  const achievement = await db.achievement.findUnique({ where: { key } });
  if (!achievement) return;

  const existing = await db.userAchievement.findUnique({
    where: { ownerId_achievementId: { ownerId: userId, achievementId: achievement.id } }
  });
  if (existing) return;

  await db.userAchievement.create({
    data: { ownerId: userId, achievementId: achievement.id }
  });
  await db.user.update({
    where: { id: userId },
    data: { currency: { increment: achievement.reward } }
  });
  await db.transaction.create({
    data: {
      ownerId: userId,
      type: TransactionType.ACHIEVEMENT,
      amount: achievement.reward,
      metadata: { achievementKey: key }
    }
  });
}

export async function evaluateAchievements(db: RewardsDb, userId: string) {
  const [user, fish, purchaseCount, feedCount, friendCount, giftCount] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { currency: true } }),
    db.fish.findMany({
      where: { ownerId: userId, isGiftLocked: false },
      include: { fishType: true }
    }),
    db.transaction.count({ where: { ownerId: userId, type: TransactionType.PURCHASE_FISH } }),
    db.transaction.count({ where: { ownerId: userId, type: TransactionType.FEED } }),
    db.friend.count({ where: { ownerId: userId } }),
    db.transaction.count({ where: { ownerId: userId, type: TransactionType.GIFT_SENT } })
  ]);

  if (!user) return;

  const rarities = new Set(fish.map((item) => item.fishType.rarity));
  const species = new Set(fish.map((item) => item.fishType.species));
  const checks: Array<[boolean, string]> = [
    [fish.length >= 5, "first_school"],
    [user.currency >= 1000, "algae_banker"],
    [purchaseCount >= 1, "case_opener"],
    [rarities.has(Rarity.RARE), "rare_friend"],
    [rarities.has(Rarity.EPIC), "epic_splash"],
    [rarities.has(Rarity.LEGENDARY), "legendary_luck"],
    [feedCount >= 25, "caring_owner"],
    [friendCount >= 1, "social_aquarium"],
    [giftCount >= 1, "generous_gift"],
    [species.size >= 8, "collector"]
  ];

  for (const [passed, key] of checks) {
    if (passed) await unlockAchievement(db, userId, key);
  }
}
