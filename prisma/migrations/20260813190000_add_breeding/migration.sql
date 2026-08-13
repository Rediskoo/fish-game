CREATE TYPE "FishLifeStage" AS ENUM ('EGG', 'EMBRYO', 'HATCHING', 'FRY', 'BABY', 'ADULT');
CREATE TYPE "FishOrigin" AS ENUM ('STARTER', 'SHOP', 'CASE', 'BRED');
CREATE TYPE "BreedingStatus" AS ENUM ('INCUBATING', 'READY_TO_HATCH', 'HATCHED', 'GROWING', 'READY_TO_GROW', 'COMPLETED', 'CANCELLED');

ALTER TYPE "TransactionType" ADD VALUE 'BREEDING_START';
ALTER TYPE "TransactionType" ADD VALUE 'BREEDING_SPEEDUP';
ALTER TYPE "TransactionType" ADD VALUE 'BREEDING_COMPLETE';
ALTER TYPE "TransactionType" ADD VALUE 'PURCHASE_BREEDING_ITEM';

ALTER TABLE "fish"
ADD COLUMN "lifeStage" "FishLifeStage" NOT NULL DEFAULT 'ADULT',
ADD COLUMN "origin" "FishOrigin" NOT NULL DEFAULT 'CASE',
ADD COLUMN "genome" JSONB,
ADD COLUMN "genomeVersion" TEXT,
ADD COLUMN "hybridKey" TEXT,
ADD COLUMN "parentAId" TEXT,
ADD COLUMN "parentBId" TEXT,
ADD COLUMN "parentSnapshots" JSONB,
ADD COLUMN "bornAt" TIMESTAMP(3),
ADD COLUMN "breedingLocked" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "inventory"
ADD COLUMN "spawningNest" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "eggIncubator" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "fryFood" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "nurseryConditioner" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "genealogyMedallion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "inventory"
ADD COLUMN "bigFood" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "superFood" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "superCleaner" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "breeding_jobs" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "parentAId" TEXT,
  "parentBId" TEXT,
  "parentASnapshot" JSONB NOT NULL,
  "parentBSnapshot" JSONB NOT NULL,
  "hybridKey" TEXT NOT NULL,
  "genome" JSONB NOT NULL,
  "genomeVersion" TEXT NOT NULL DEFAULT '1.0.0',
  "rarity" "Rarity" NOT NULL,
  "status" "BreedingStatus" NOT NULL DEFAULT 'INCUBATING',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "hatchAt" TIMESTAMP(3) NOT NULL,
  "babyAt" TIMESTAMP(3) NOT NULL,
  "adultAt" TIMESTAMP(3) NOT NULL,
  "claimedAt" TIMESTAMP(3),
  "resultingFishId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "speedupsUsed" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "breeding_jobs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "breeding_jobs_resultingFishId_key" ON "breeding_jobs"("resultingFishId");
CREATE UNIQUE INDEX "breeding_jobs_ownerId_idempotencyKey_key" ON "breeding_jobs"("ownerId", "idempotencyKey");
CREATE INDEX "breeding_jobs_ownerId_status_idx" ON "breeding_jobs"("ownerId", "status");
CREATE INDEX "breeding_jobs_parentAId_idx" ON "breeding_jobs"("parentAId");
CREATE INDEX "breeding_jobs_parentBId_idx" ON "breeding_jobs"("parentBId");
ALTER TABLE "breeding_jobs" ADD CONSTRAINT "breeding_jobs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "breeding_jobs" ADD CONSTRAINT "breeding_jobs_parentAId_fkey" FOREIGN KEY ("parentAId") REFERENCES "fish"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "breeding_jobs" ADD CONSTRAINT "breeding_jobs_parentBId_fkey" FOREIGN KEY ("parentBId") REFERENCES "fish"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "breeding_jobs" ADD CONSTRAINT "breeding_jobs_resultingFishId_fkey" FOREIGN KEY ("resultingFishId") REFERENCES "fish"("id") ON DELETE SET NULL ON UPDATE CASCADE;
