import { TransactionType, type PrismaClient } from "@prisma/client";
import { applyHungerDecay } from "@/server/services/hunger.service";
import { aquariumFishCapacity } from "@/lib/fish-capacity";
import { calculateFishIncome, calculateOfflineSeconds } from "@/lib/game-mechanics";
export { calculateFishIncome } from "@/lib/game-mechanics";

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
  const offlineSeconds = calculateOfflineSeconds(snapshot.aquarium.lastIncomeAt, now);
  const incomePerSecond = calculateFishIncome(snapshot.fish.slice(0, aquariumFishCapacity));
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
