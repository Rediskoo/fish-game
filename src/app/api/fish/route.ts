import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { renameFishSchema } from "@/lib/validation/game";
import { FishService } from "@/server/services/fish.service";
import { PlayerService } from "@/server/services/player.service";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const url = new URL(request.url);
    const fishId = url.searchParams.get("fishId");
    if (!fishId) return fail("fishId is required");

    const body = renameFishSchema.parse(await request.json());
    await new FishService(getPrisma()).renameFish(userId, fishId, body.name);
    const snapshot = await new PlayerService(getPrisma()).getSnapshot(userId);
    return ok(snapshot);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Fish update failed");
  }
}

export async function DELETE(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const url = new URL(request.url);
    const fishId = url.searchParams.get("fishId");
    if (!fishId) return fail("fishId is required");

    await new FishService(getPrisma()).sellFish(userId, fishId);
    const snapshot = await new PlayerService(getPrisma()).getSnapshot(userId);
    return ok(snapshot);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Fish delete failed");
  }
}
