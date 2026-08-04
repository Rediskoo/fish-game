import crypto from "node:crypto";
import { getEnv } from "@/lib/env";

type ReplyMarkup = {
  inline_keyboard: Array<Array<{ text: string; web_app: { url: string } }>>;
};

export type TelegramBotUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type TelegramUpdate = {
  message?: {
    chat: { id: number; type: string };
    from?: TelegramBotUser;
    text?: string;
  };
};

function webhookSecret(token: string) {
  return crypto.createHash("sha256").update(`aquarium-webhook:${token}`).digest("hex");
}

export function isTelegramWebhookRequest(secret: string | null) {
  const token = getEnv().TELEGRAM_BOT_TOKEN;
  return Boolean(token && secret === webhookSecret(token));
}

export async function configureTelegramWebhook() {
  const { TELEGRAM_BOT_TOKEN: token, NEXT_PUBLIC_APP_URL: appUrl } = getEnv();
  if (!token || !appUrl) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: new URL("/api/telegram/webhook", appUrl).toString(),
        secret_token: webhookSecret(token),
        allowed_updates: ["message"]
      })
    });
    const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    return response.ok && payload?.ok === true;
  } catch {
    return false;
  }
}

function appKeyboard(): ReplyMarkup | undefined {
  const url = getEnv().NEXT_PUBLIC_TELEGRAM_MINI_APP_URL;
  return url ? { inline_keyboard: [[{ text: "Открыть аквариум 🐠", web_app: { url } }]] } : undefined;
}

export async function sendTelegramMessage(chatId: string | number, text: string) {
  const token = getEnv().TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, reply_markup: appKeyboard() })
    });
    const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    return response.ok && payload?.ok === true;
  } catch {
    return false;
  }
}

export async function notifyFriendRequest(targetTelegramId: bigint, senderName: string) {
  return sendTelegramMessage(targetTelegramId.toString(), `👋 ${senderName} отправил(а) тебе заявку в друзья.\n\nОткрой аквариум, чтобы принять или отклонить её.`);
}

export async function notifyGift(targetTelegramId: bigint, senderName: string, giftLabel: string) {
  return sendTelegramMessage(targetTelegramId.toString(), `🎁 ${senderName} прислал(а) тебе подарок: ${giftLabel}.\n\nЗагляни в аквариум, чтобы забрать его.`);
}

export async function notifyAquariumVisit(targetTelegramId: bigint, visitorName: string) {
  return sendTelegramMessage(targetTelegramId.toString(), `👀 ${visitorName} посетил(а) ваш аквариум.`);
}

export async function notifyDailyReward(targetTelegramId: bigint) {
  return sendTelegramMessage(targetTelegramId.toString(), "🌿 Ежедневная награда уже ждёт вас! Откройте аквариум и заберите 100 водорослей.");
}
