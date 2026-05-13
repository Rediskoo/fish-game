import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { RewardsService } from "@/server/services/rewards.service";
import { PlayerService } from "@/server/services/player.service";

export const runtime = "nodejs";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const reward = await new RewardsService(getPrisma()).claimDaily(userId);
    const snapshot = await new PlayerService(getPrisma()).getSnapshot(userId);
    return ok({ reward, snapshot });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Daily reward failed");
  }
}
