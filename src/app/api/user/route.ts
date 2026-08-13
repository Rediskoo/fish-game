import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { PlayerService } from "@/server/services/player.service";
import { z } from "zod";
import { ensureLatestSchema } from "@/server/services/schema-compat.service";

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

const profileSchema = z.object({
  profileName: z.string().trim().min(1).max(18),
  profileBio: z.string().trim().max(140),
  profileAvatar: z.string().max(500).nullable()
});

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);
  try {
    const input = profileSchema.parse(await request.json());
    const db = getPrisma();
    await ensureLatestSchema(db);
    await db.user.update({ where: { id: userId }, data: input });
    return ok(await new PlayerService(db).getSnapshot(userId));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Profile update failed", 400);
  }
}
