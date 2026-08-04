import { getPrisma } from "@/lib/db/prisma";
import { requireEnv } from "@/lib/env";
import { fail, ok } from "@/lib/api/responses";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { validateTelegramInitData } from "@/lib/telegram/validate-init-data";
import { telegramAuthSchema } from "@/lib/validation/game";
import { PlayerService } from "@/server/services/player.service";
import { sendTelegramMessage } from "@/lib/telegram/bot";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = telegramAuthSchema.parse(await request.json());
    const telegram = validateTelegramInitData(body.initData, requireEnv("TELEGRAM_BOT_TOKEN"));
    const db = getPrisma();
    const existingPlayer = await db.user.findUnique({ where: { telegramId: BigInt(telegram.user.id) }, select: { id: true } });
    const snapshot = await new PlayerService(db).syncTelegramUser(telegram.user);
    if (!existingPlayer) {
      const name = telegram.user.first_name ?? "друг";
      await sendTelegramMessage(snapshot.user.telegramId, `🐠 Привет, ${name}! Добро пожаловать в Аквариум. Здесь тебя ждут рыбки, подарки и друзья.`);
    }
    const token = await createSession(snapshot.user.id, snapshot.user.telegramId);
    await setSessionCookie(token);
    return ok(snapshot);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Telegram auth failed", 401);
  }
}
