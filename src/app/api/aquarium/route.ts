import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { PlayerService } from "@/server/services/player.service";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const body = (await request.json().catch(() => ({}))) as { decorId?: string; enabled?: boolean; backgroundId?: string; clean?: boolean; superClean?: boolean };
    const service = new PlayerService(getPrisma());
    if (body.clean || body.superClean) {
      await service.cleanAquarium(userId, Boolean(body.superClean));
    } else {
      await service.customizeAquarium(userId, body);
    }
    return ok(await service.getSnapshot(userId));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Aquarium update failed");
  }
}
