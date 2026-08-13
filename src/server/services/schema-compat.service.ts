import type { PrismaClient } from "@prisma/client";

let schemaPromise: Promise<void> | null = null;

/** Keeps rolling deploys compatible when the managed database is reachable
 * from Vercel Runtime but intentionally unavailable to the build machine. */
export function ensureLatestSchema(db: PrismaClient) {
  schemaPromise ??= (async () => {
    await db.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileName" TEXT`);
    await db.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileBio" TEXT`);
    await db.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileAvatar" TEXT`);
    await db.$executeRawUnsafe(`ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'MATCH_THREE_REWARD'`);
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}
