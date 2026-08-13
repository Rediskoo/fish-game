import { getPrisma } from "@/lib/db/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api/responses";
import { MatchThreeService } from "@/server/services/match-three.service";
import { z } from "zod";

export const runtime = "nodejs";

const inputSchema = z.discriminatedUnion("action", [z.object({ action: z.literal("start") }), z.object({ action: z.literal("flip"), gameId: z.string().cuid(), index: z.number().int().min(0).max(31) })]);

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);
  try { const input = inputSchema.parse(await request.json()); const service = new MatchThreeService(getPrisma()); return ok(input.action === "start" ? await service.start(userId) : await service.flip(userId, input.gameId, input.index)); }
  catch (error) { return fail(error instanceof Error ? error.message : "Memory game failed", 400); }
}
