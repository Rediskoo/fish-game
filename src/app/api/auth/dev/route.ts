import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { PlayerService } from "@/server/services/player.service";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return fail("Dev auth is disabled in production", 404);
  }

  const snapshot = await new PlayerService(getPrisma()).syncTelegramUser({
    id: 1000001,
    first_name: "Local",
    username: "local_aquarist"
  });
  const token = await createSession(snapshot.user.id, snapshot.user.telegramId);
  await setSessionCookie(token);
  return ok(snapshot);
}
