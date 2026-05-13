import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { claimOfflineIncome } from "@/server/services/income.service";
import { PlayerService } from "@/server/services/player.service";

export const runtime = "nodejs";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const claimed = await claimOfflineIncome(getPrisma(), userId);
    const snapshot = await new PlayerService(getPrisma()).getSnapshot(userId);
    return ok({ claimed, snapshot });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Income claim failed");
  }
}
