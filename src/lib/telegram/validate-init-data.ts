import crypto from "node:crypto";

export type TelegramInitUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type ValidTelegramInitData = {
  user: TelegramInitUser;
  authDate: Date;
  queryId?: string;
};

export function validateTelegramInitData(initData: string, botToken: string): ValidTelegramInitData {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new Error("Telegram initData hash is missing");
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculated = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  if (hash.length !== calculated.length || !crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash))) {
    throw new Error("Telegram initData hash is invalid");
  }

  const rawUser = params.get("user");
  if (!rawUser) {
    throw new Error("Telegram user payload is missing");
  }

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > 86400) {
    throw new Error("Telegram initData is expired");
  }

  return {
    user: JSON.parse(rawUser) as TelegramInitUser,
    authDate: new Date(authDate * 1000),
    queryId: params.get("query_id") ?? undefined
  };
}
