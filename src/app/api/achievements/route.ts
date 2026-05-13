import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { RewardsService } from "@/server/services/rewards.service";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const achievements = await new RewardsService(getPrisma()).listAchievements(userId);
    return ok(achievements);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Achievements fetch failed");
  }
}
