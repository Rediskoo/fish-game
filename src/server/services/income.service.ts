import { TransactionType, type PrismaClient } from "@prisma/client";
import { applyHungerDecay } from "@/server/services/hunger.service";

const maxOfflineSeconds = 60 * 60 * 24 * 7;

export function calculateFishIncome(fish: Array<{ fishType: { incomePerSecond: number; maxHunger: number }; hunger: number; incomeMultiplier: number }>) {
  return fish.reduce((sum, item) => {
    const hungerPercent = (item.hunger / item.fishType.maxHunger) * 100;
    const hungerPenalty = hungerPercent >= 90 ? 0.25 : hungerPercent >= 70 ? 0.6 : 1;
    return sum + item.fishType.incomePerSecond * item.incomeMultiplier * hungerPenalty;
  }, 0);
}

export async function claimOfflineIncome(db: PrismaClient, userId: string) {
  await applyHungerDecay(db, userId);

  const snapshot = await db.user.findUnique({
    where: { id: userId },
    include: {
      aquarium: true,
      fish: { include: { fishType: true } }
    }
  });

  if (!snapshot?.aquarium) {
    throw new Error("Aquarium not found");
  }

  const now = new Date();
  const offlineSeconds = Math.min(
    maxOfflineSeconds,
    Math.max(0, Math.floor((now.getTime() - snapshot.aquarium.lastIncomeAt.getTime()) / 1000))
  );
  const incomePerSecond = calculateFishIncome(snapshot.fish);
  const amount = Math.floor(incomePerSecond * offlineSeconds);

  if (amount <= 0) {
    await db.aquarium.update({ where: { ownerId: userId }, data: { lastIncomeAt: now } });
    return { amount: 0, incomePerSecond, offlineSeconds };
  }

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { currency: { increment: amount } } }),
    db.aquarium.update({ where: { ownerId: userId }, data: { lastIncomeAt: now } }),
    db.transaction.create({
      data: {
        ownerId: userId,
        type: TransactionType.INCOME,
        amount,
        metadata: { offlineSeconds, incomePerSecond }
      }
    })
  ]);

  return { amount, incomePerSecond, offlineSeconds };
}
