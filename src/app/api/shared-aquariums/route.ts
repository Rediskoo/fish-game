import { z } from "zod";
import { getPrisma } from "@/lib/db/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api/responses";
import { SharedAquariumService } from "@/server/services/shared-aquarium.service";

const actionSchema = z.object({ aquariumId: z.string().cuid(), action: z.enum(["feed", "clean", "rename", "customize"]), fishId: z.string().cuid().optional(), name: z.string().trim().max(18).optional(), itemId: z.string().max(40).optional() });
export async function GET() { const userId = await getSessionUserId(); if (!userId) return fail("Unauthorized", 401); try { return ok(await new SharedAquariumService(getPrisma()).getState(userId)); } catch (error) { return fail(error instanceof Error ? error.message : "Shared aquarium failed", 500); } }
export async function PATCH(request: Request) { const userId = await getSessionUserId(); if (!userId) return fail("Unauthorized", 401); try { const input = actionSchema.parse(await request.json()); return ok(await new SharedAquariumService(getPrisma()).act(userId, input)); } catch (error) { return fail(error instanceof Error ? error.message : "Shared aquarium action failed", 400); } }
