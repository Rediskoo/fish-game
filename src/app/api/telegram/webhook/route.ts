import { getPrisma } from "@/lib/db/prisma";
import { isTelegramWebhookRequest, sendTelegramMessage, type TelegramUpdate } from "@/lib/telegram/bot";
import { PlayerService } from "@/server/services/player.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTelegramWebhookRequest(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const message = update?.message;
  if (!message?.from || message.chat.type !== "private") return Response.json({ ok: true });

  if (message.text?.startsWith("/start")) {
    await new PlayerService(getPrisma()).syncTelegramUser(message.from);
    const name = message.from.first_name ?? "друг";
    await sendTelegramMessage(message.chat.id, `🐠 Привет, ${name}! Добро пожаловать в Аквариум. Нажми кнопку ниже, чтобы начать игру.`);
  } else {
    await sendTelegramMessage(message.chat.id, "🐠 Нажми кнопку ниже, чтобы открыть свой аквариум.");
  }
  return Response.json({ ok: true });
}
