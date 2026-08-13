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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
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
  const inserted = await db.userAchievement.createMany({
    data: [{ ownerId: userId, achievementId: achievement.id }],
    skipDuplicates: true
  });
  if (inserted.count === 0) return;
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

export async function getAchievementProgress(db: RewardsDb, userId: string) {
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

  if (!user) return [];

  const rarities = new Set(fish.map((item) => item.fishType.rarity));
  const species = new Set(fish.map((item) => item.fishType.species));
  return [
    { key: "first_school", current: fish.length, target: 5 },
    { key: "algae_banker", current: user.currency, target: 1000 },
    { key: "case_opener", current: purchaseCount, target: 1 },
    { key: "rare_friend", current: Number(rarities.has(Rarity.RARE)), target: 1 },
    { key: "epic_splash", current: Number(rarities.has(Rarity.EPIC)), target: 1 },
    { key: "legendary_luck", current: Number(rarities.has(Rarity.LEGENDARY)), target: 1 },
    { key: "caring_owner", current: feedCount, target: 25 },
    { key: "social_aquarium", current: friendCount, target: 1 },
    { key: "generous_gift", current: giftCount, target: 1 },
    { key: "collector", current: species.size, target: 8 }
  ];
}

export async function evaluateAchievements(db: RewardsDb, userId: string) {
  const progress = await getAchievementProgress(db, userId);
  for (const item of progress) {
    if (item.current >= item.target) await unlockAchievement(db, userId, item.key);
  }
}
