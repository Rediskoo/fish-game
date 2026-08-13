import { randomInt } from "node:crypto";
import { BreedingStatus, FishLifeStage, FishOrigin, FishPersonality, Rarity, TransactionType, type Prisma, type PrismaClient } from "@prisma/client";
import { aquariumFishCapacity } from "@/lib/fish-capacity";
import { breedingGeneticsVersion, createChildGenome, findHybrid } from "@/features/breeding/breeding-genetics";
import { applyFryFoodTimes, applyIncubatorTimes, resolveBreedingStatus, resolveLifeStage } from "@/features/breeding/breeding-time";
import { validateBreedingParents, type ParentEligibility } from "@/features/breeding/breeding-rules";
import type { BreedingJobView, BreedingParentSnapshot, FishGenome } from "@/features/breeding/types";

const maxConcurrentJobs = 1;
const hatchDurationMs = 2 * 60 * 60 * 1000;
const fryDurationMs = 4 * 60 * 60 * 1000;
const babyDurationMs = 6 * 60 * 60 * 1000;
const speedupMs = 2 * 60 * 60 * 1000;

const speciesKey: Record<string, string> = {
  GOLDFISH: "goldfish", GUPPY: "guppy", BETTA: "betta", NEON_TETRA: "neon-tetra",
  ANGELFISH: "angelfish", DISCUS: "discus", MANDARINFISH: "crystal-tang", DRAGON_KOI: "celestial-koi"
};
const rarityMap: Record<string, Rarity> = { common: Rarity.COMMON, uncommon: Rarity.COMMON, rare: Rarity.RARE, epic: Rarity.EPIC, legendary: Rarity.LEGENDARY };

type FishWithType = Prisma.FishGetPayload<{ include: { fishType: true } }>;

function readGenome(value: Prisma.JsonValue | null): FishGenome | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as unknown as FishGenome;
}

function parentSnapshot(fish: FishWithType): BreedingParentSnapshot {
  return {
    fishId: fish.id,
    species: fish.hybridKey ?? speciesKey[fish.fishType.species],
    displayName: fish.name,
    genome: readGenome(fish.genome),
    rarity: fish.fishType.rarity
  };
}

function eligibility(fish: FishWithType): ParentEligibility {
  return { ...parentSnapshot(fish), ownerId: fish.ownerId, lifeStage: fish.lifeStage, breedingLocked: fish.breedingLocked, isGiftLocked: fish.isGiftLocked, hunger: fish.hunger, maxHunger: fish.fishType.maxHunger };
}

function jobView(job: Prisma.BreedingJobGetPayload<Record<string, never>>, now: Date): BreedingJobView {
  const base = {
    status: job.status.toLowerCase().replaceAll("_", "-") as BreedingJobView["status"],
    startedAt: job.startedAt.toISOString(), hatchAt: job.hatchAt.toISOString(), babyAt: job.babyAt.toISOString(), adultAt: job.adultAt.toISOString()
  };
  return {
    id: job.id,
    parentA: job.parentASnapshot as unknown as BreedingParentSnapshot,
    parentB: job.parentBSnapshot as unknown as BreedingParentSnapshot,
    hybridKey: job.hybridKey,
    genome: job.genome as unknown as FishGenome,
    rarity: job.rarity,
    status: resolveBreedingStatus(base, now),
    lifeStage: resolveLifeStage(base, now),
    startedAt: base.startedAt, hatchAt: base.hatchAt, babyAt: base.babyAt, adultAt: base.adultAt,
    claimedAt: job.claimedAt?.toISOString() ?? null,
    resultingFishId: job.resultingFishId,
    speedupsUsed: job.speedupsUsed
  };
}

export class BreedingService {
  constructor(private readonly db: PrismaClient) {}

  async getState(userId: string, now = new Date()) {
    const [jobs, inventory] = await Promise.all([
      this.db.breedingJob.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.db.inventory.findUniqueOrThrow({ where: { ownerId: userId } })
    ]);
    return {
      jobs: jobs.map((job) => jobView(job, now)),
      inventory: { spawningNest: inventory.spawningNest, eggIncubator: inventory.eggIncubator, fryFood: inventory.fryFood, nurseryConditioner: inventory.nurseryConditioner, genealogyMedallion: inventory.genealogyMedallion },
      serverNow: now.toISOString(), maxConcurrentJobs
    };
  }

  async start(userId: string, input: { parentAId: string; parentBId: string; idempotencyKey: string }, now = new Date()) {
    const ownerId = userId;
    return this.db.$transaction(async (tx) => {
      const previous = await tx.breedingJob.findUnique({ where: { ownerId_idempotencyKey: { ownerId: userId, idempotencyKey: input.idempotencyKey } } });
      if (previous) return jobView(previous, now);
      const parents = await tx.fish.findMany({ where: { id: { in: [input.parentAId, input.parentBId] }, ownerId }, include: { fishType: true } });
      const parentA = parents.find((fish) => fish.id === input.parentAId);
      const parentB = parents.find((fish) => fish.id === input.parentBId);
      if (!parentA || !parentB) throw new Error("Родитель не найден");
      validateBreedingParents(eligibility(parentA), eligibility(parentB), userId);
      const activeJobs = await tx.breedingJob.count({ where: { ownerId, status: { notIn: [BreedingStatus.COMPLETED, BreedingStatus.CANCELLED] } } });
      if (activeJobs >= maxConcurrentJobs) throw new Error("Все слоты разведения заняты");
      const fishCount = await tx.fish.count({ where: { ownerId, isGiftLocked: false } });
      if (fishCount + activeJobs >= aquariumFishCapacity) throw new Error("Освободите место для будущей рыбы");
      const inventory = await tx.inventory.findUniqueOrThrow({ where: { ownerId: userId } });
      if (inventory.spawningNest <= 0) throw new Error("Для запуска нужно нерестовое гнездо");
      const hybrid = findHybrid(parentSnapshot(parentA).species, parentSnapshot(parentB).species);
      if (!hybrid) throw new Error("Для этой пары пока нет готового визуального варианта");
      const seed = randomInt(1, 2_147_483_647);
      const snapshotA = parentSnapshot(parentA);
      const snapshotB = parentSnapshot(parentB);
      const genome = createChildGenome(snapshotA, snapshotB, seed);
      const lockedA = await tx.fish.updateMany({ where: { id: parentA.id, ownerId, breedingLocked: false, isGiftLocked: false, lifeStage: FishLifeStage.ADULT }, data: { breedingLocked: true } });
      const lockedB = await tx.fish.updateMany({ where: { id: parentB.id, ownerId, breedingLocked: false, isGiftLocked: false, lifeStage: FishLifeStage.ADULT }, data: { breedingLocked: true } });
      if (lockedA.count !== 1 || lockedB.count !== 1) throw new Error("Одна из рыб только что стала недоступна");
      await tx.inventory.update({ where: { ownerId }, data: { spawningNest: { decrement: 1 } } });
      const hatchAt = new Date(now.getTime() + hatchDurationMs);
      const babyAt = new Date(hatchAt.getTime() + fryDurationMs);
      const adultAt = new Date(babyAt.getTime() + babyDurationMs);
      const job = await tx.breedingJob.create({ data: {
        ownerId, parentAId: parentA.id, parentBId: parentB.id,
        parentASnapshot: snapshotA as unknown as Prisma.InputJsonValue, parentBSnapshot: snapshotB as unknown as Prisma.InputJsonValue,
        hybridKey: hybrid.key, genome: genome as unknown as Prisma.InputJsonValue, genomeVersion: breedingGeneticsVersion,
        rarity: rarityMap[hybrid.config.rarity] ?? Rarity.RARE, startedAt: now, hatchAt, babyAt, adultAt, idempotencyKey: input.idempotencyKey
      } });
      await tx.transaction.create({ data: { ownerId, type: TransactionType.BREEDING_START, amount: -1, metadata: { jobId: job.id, item: "spawning-nest" } } });
      return jobView(job, now);
    }, { isolationLevel: "Serializable" });
  }

  async speedUp(userId: string, jobId: string, now = new Date()) {
    const ownerId = userId;
    return this.db.$transaction(async (tx) => {
      const job = await tx.breedingJob.findFirst({ where: { id: jobId, ownerId } });
      if (!job) throw new Error("Процесс разведения не найден");
      const view = jobView(job, now);
      if (!(["fry", "baby"] as const).includes(view.lifeStage as "fry" | "baby")) throw new Error("Корм для малышей работает только на стадиях малька и малыша");
      if (job.speedupsUsed >= 3) throw new Error("Лимит ускорений для этого малыша исчерпан");
      const inventory = await tx.inventory.findUniqueOrThrow({ where: { ownerId } });
      if (inventory.fryFood <= 0) throw new Error("Нет корма для малышей");
      const { babyAt, adultAt } = applyFryFoodTimes(jobView(job, now), view.lifeStage as "fry" | "baby", now, speedupMs);
      if (job.adultAt.getTime() - adultAt.getTime() < 60_000) throw new Error("До взросления осталось слишком мало времени для ускорения");
      await tx.inventory.update({ where: { ownerId }, data: { fryFood: { decrement: 1 } } });
      const updated = await tx.breedingJob.update({ where: { id: job.id }, data: { babyAt, adultAt, speedupsUsed: { increment: 1 } } });
      await tx.transaction.create({ data: { ownerId, type: TransactionType.BREEDING_SPEEDUP, amount: -1, metadata: { jobId, item: "fry-food" } } });
      return jobView(updated, now);
    }, { isolationLevel: "Serializable" });
  }

  async incubate(userId: string, jobId: string, now = new Date()) {
    return this.db.$transaction(async (tx) => {
      const job = await tx.breedingJob.findFirst({ where: { id: jobId, ownerId: userId } });
      if (!job) throw new Error("Процесс разведения не найден");
      const view = jobView(job, now);
      if (!(view.lifeStage === "egg" || view.lifeStage === "embryo")) throw new Error("Инкубатор работает только с икрой");
      const inventory = await tx.inventory.findUniqueOrThrow({ where: { ownerId: userId } });
      if (inventory.eggIncubator <= 0) throw new Error("Нет инкубатора икры");
      const times = applyIncubatorTimes(jobView(job, now), now);
      if (job.hatchAt.getTime() - times.hatchAt.getTime() < 60_000) throw new Error("До вылупления осталось слишком мало времени для инкубатора");
      await tx.inventory.update({ where: { ownerId: userId }, data: { eggIncubator: { decrement: 1 } } });
      const updated = await tx.breedingJob.update({ where: { id: job.id }, data: times });
      await tx.transaction.create({ data: { ownerId: userId, type: TransactionType.BREEDING_SPEEDUP, amount: -1, metadata: { jobId, item: "egg-incubator", reductionMs: job.adultAt.getTime() - updated.adultAt.getTime() } } });
      return jobView(updated, now);
    }, { isolationLevel: "Serializable" });
  }

  async conditionNursery(userId: string, jobId: string, now = new Date()) {
    return this.db.$transaction(async (tx) => {
      const job = await tx.breedingJob.findFirst({ where: { id: jobId, ownerId: userId } });
      if (!job) throw new Error("Процесс разведения не найден");
      const stage = jobView(job, now).lifeStage;
      if (stage === "adult") throw new Error("Рыба уже выросла");
      const inventory = await tx.inventory.findUniqueOrThrow({ where: { ownerId: userId } });
      if (inventory.nurseryConditioner <= 0) throw new Error("Нет кондиционера питомника");
      const reduction = 30 * 60 * 1000;
      const times = stage === "egg" || stage === "embryo"
        ? applyIncubatorTimes(jobView(job, now), now, reduction)
        : { babyAt: new Date(Math.max(now.getTime() + 5 * 60 * 1000, job.babyAt.getTime() - reduction)), adultAt: new Date(Math.max(now.getTime() + 10 * 60 * 1000, job.adultAt.getTime() - reduction)) };
      if (job.adultAt.getTime() - times.adultAt.getTime() < 60_000) throw new Error("До следующей стадии осталось слишком мало времени");
      await tx.inventory.update({ where: { ownerId: userId }, data: { nurseryConditioner: { decrement: 1 } } });
      const updated = await tx.breedingJob.update({ where: { id: job.id }, data: times });
      await tx.transaction.create({ data: { ownerId: userId, type: TransactionType.BREEDING_SPEEDUP, amount: -1, metadata: { jobId, item: "nursery-conditioner", reductionMs: reduction } } });
      return jobView(updated, now);
    }, { isolationLevel: "Serializable" });
  }

  async claim(userId: string, jobId: string, now = new Date()) {
    const ownerId = userId;
    return this.db.$transaction(async (tx) => {
      const job = await tx.breedingJob.findFirst({ where: { id: jobId, ownerId } });
      if (!job) throw new Error("Процесс разведения не найден");
      if (job.resultingFishId) return job.resultingFishId;
      if (now < job.adultAt) throw new Error("Рыба ещё не выросла");
      const claimed = await tx.breedingJob.updateMany({ where: { id: job.id, ownerId, resultingFishId: null, claimedAt: null }, data: { claimedAt: now, status: BreedingStatus.COMPLETED } });
      if (claimed.count !== 1) {
        const existing = await tx.breedingJob.findUniqueOrThrow({ where: { id: job.id } });
        if (existing.resultingFishId) return existing.resultingFishId;
        throw new Error("Получение уже выполняется");
      }
      const parent = job.parentAId
        ? await tx.fish.findFirst({ where: { id: job.parentAId, ownerId }, include: { fishType: true } })
        : null;
      const fallbackType = parent?.fishType ?? await tx.fishType.findFirstOrThrow({ where: { rarity: job.rarity } });
      const snapshots = [job.parentASnapshot, job.parentBSnapshot] as Prisma.InputJsonValue[];
      const fish = await tx.fish.create({ data: {
        ownerId, fishTypeId: fallbackType.id, name: `Гибрид ${job.hybridKey}`, swimSpeed: fallbackType.swimSpeed,
        personality: FishPersonality.CURIOUS, descriptionSeed: (job.genome as unknown as FishGenome).mutationSeed,
        genome: job.genome as Prisma.InputJsonValue, genomeVersion: job.genomeVersion, hybridKey: job.hybridKey,
        parentAId: job.parentAId, parentBId: job.parentBId, parentSnapshots: snapshots,
        bornAt: now, origin: FishOrigin.BRED, lifeStage: FishLifeStage.ADULT,
        animationState: { x: 0.5, y: 0.5, direction: 1 }
      } });
      await tx.breedingJob.update({ where: { id: job.id }, data: { resultingFishId: fish.id } });
      await tx.fish.updateMany({ where: { id: { in: [job.parentAId, job.parentBId].filter((id): id is string => Boolean(id)) } }, data: { breedingLocked: false } });
      await tx.transaction.create({ data: { ownerId, type: TransactionType.BREEDING_COMPLETE, amount: 0, metadata: { jobId, fishId: fish.id, hybridKey: job.hybridKey } } });
      return fish.id;
    }, { isolationLevel: "Serializable" });
  }
}
