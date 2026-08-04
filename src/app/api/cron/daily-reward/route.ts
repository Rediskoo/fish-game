import { getPrisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { notifyDailyReward } from "@/lib/telegram/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = getEnv().CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });

  const db = getPrisma();
  const now = new Date();
  const eligibleBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dayKey = now.toISOString().slice(0, 10);
  const users = await db.user.findMany({
    where: { dailyRewards: { none: { claimedAt: { gt: eligibleBefore } } } },
    select: { id: true, telegramId: true },
    take: 500
  });

  let sent = 0;
  for (const user of users) {
    const key = `daily:${dayKey}:${user.id}`;
    try {
      await db.botNotification.create({ data: { key } });
    } catch {
      continue;
    }
    if (await notifyDailyReward(user.telegramId)) {
      sent += 1;
    } else {
      await db.botNotification.delete({ where: { key } }).catch(() => undefined);
    }
  }
  return Response.json({ ok: true, sent });
}
