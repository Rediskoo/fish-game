import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { getSessionUserId } from "@/lib/auth/session";
import { MarketplaceService } from "@/server/services/marketplace.service";
import { PlayerService } from "@/server/services/player.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail("Unauthorized", 401);

  try {
    const body = (await request.json().catch(() => ({}))) as { item?: string; amount?: number; productId?: string };
    let caseResult = null;
    if (body.item === "food") {
      await new PlayerService(getPrisma()).buyFood(userId, body.amount ?? 1);
    } else if (body.item === "product" && body.productId) {
      await new PlayerService(getPrisma()).buyProduct(userId, body.productId);
    } else {
      caseResult = await new MarketplaceService(getPrisma()).purchaseFish(userId);
    }
    const snapshot = await new PlayerService(getPrisma()).getSnapshot(userId);
    return ok({ snapshot, caseResult });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Purchase failed");
  }
}
