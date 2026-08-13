ALTER TABLE "shared_aquariums" ADD COLUMN IF NOT EXISTS "backgroundId" TEXT NOT NULL DEFAULT 'deep-lagoon';
ALTER TABLE "shared_aquariums" ADD COLUMN IF NOT EXISTS "decor" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "shared_aquariums" ADD COLUMN IF NOT EXISTS "ownedItemIds" JSONB NOT NULL DEFAULT '[]';
