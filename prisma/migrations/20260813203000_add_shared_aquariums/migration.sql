CREATE TABLE IF NOT EXISTS "shared_aquariums" (
  "id" TEXT NOT NULL,
  "pairKey" TEXT NOT NULL,
  "memberAId" TEXT NOT NULL,
  "memberBId" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'Общий аквариум',
  "pollution" INTEGER NOT NULL DEFAULT 0,
  "lastPollutionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shared_aquariums_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shared_aquariums_memberAId_fkey" FOREIGN KEY ("memberAId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "shared_aquariums_memberBId_fkey" FOREIGN KEY ("memberBId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "shared_aquariums_pairKey_key" ON "shared_aquariums"("pairKey");
CREATE INDEX IF NOT EXISTS "shared_aquariums_memberAId_idx" ON "shared_aquariums"("memberAId");
CREATE INDEX IF NOT EXISTS "shared_aquariums_memberBId_idx" ON "shared_aquariums"("memberBId");
ALTER TABLE "fish" ADD COLUMN IF NOT EXISTS "sharedAquariumId" TEXT;
ALTER TABLE "breeding_jobs" ADD COLUMN IF NOT EXISTS "collaboratorId" TEXT;
ALTER TABLE "breeding_jobs" ADD COLUMN IF NOT EXISTS "collaborationAcceptedAt" TIMESTAMP(3);
ALTER TABLE "breeding_jobs" ADD COLUMN IF NOT EXISTS "sharedAquariumId" TEXT;
CREATE INDEX IF NOT EXISTS "fish_sharedAquariumId_idx" ON "fish"("sharedAquariumId");
CREATE INDEX IF NOT EXISTS "breeding_jobs_collaboratorId_status_idx" ON "breeding_jobs"("collaboratorId", "status");
DO $$ BEGIN
  ALTER TABLE "fish" ADD CONSTRAINT "fish_sharedAquariumId_fkey" FOREIGN KEY ("sharedAquariumId") REFERENCES "shared_aquariums"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "breeding_jobs" ADD CONSTRAINT "breeding_jobs_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "breeding_jobs" ADD CONSTRAINT "breeding_jobs_sharedAquariumId_fkey" FOREIGN KEY ("sharedAquariumId") REFERENCES "shared_aquariums"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
