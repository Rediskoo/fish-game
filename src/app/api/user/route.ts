import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { PlayerService } from "@/server/services/player.service";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const snapshot = await new PlayerService(getPrisma()).getSnapshot(userId);
    return ok(snapshot);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "User fetch failed", 500);
  }
}
