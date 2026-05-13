import { getPrisma } from "@/lib/db/prisma";
import { fail, ok } from "@/lib/api/responses";
import { MarketplaceService } from "@/server/services/marketplace.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const fishTypes = await new MarketplaceService(getPrisma()).listFishTypes();
    return ok({ fishTypes, fishCost: 100, foodCost: 1 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Marketplace fetch failed", 500);
  }
}
