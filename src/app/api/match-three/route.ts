import { getPrisma } from "@/lib/db/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api/responses";
import { MatchThreeService } from "@/server/services/match-three.service";

export const runtime = "nodejs";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);
  try { return ok(await new MatchThreeService(getPrisma()).play(userId)); }
  catch (error) { return fail(error instanceof Error ? error.message : "Match-three failed", 400); }
}
