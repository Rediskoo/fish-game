import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { feedFishSchema } from "@/lib/validation/game";
import { InventoryService } from "@/server/services/inventory.service";
import { PlayerService } from "@/server/services/player.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const body = feedFishSchema.parse(await request.json());
    await new InventoryService(getPrisma()).feedFish(userId, body.fishId);
    const snapshot = await new PlayerService(getPrisma()).getSnapshot(userId);
    return ok(snapshot);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Feed failed");
  }
}
