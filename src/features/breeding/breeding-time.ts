import type { BreedingJobView, FishLifeStageValue } from "./types";

type TimedJob = Pick<BreedingJobView, "startedAt" | "hatchAt" | "babyAt" | "adultAt" | "status">;

export function resolveLifeStage(job: TimedJob, now: Date): FishLifeStageValue {
  if (job.status === "cancelled") return "egg";
  const current = now.getTime();
  const started = new Date(job.startedAt).getTime();
  const hatch = new Date(job.hatchAt).getTime();
  if (current < hatch) {
    const progress = Math.max(0, Math.min(1, (current - started) / Math.max(1, hatch - started)));
    return progress < 0.55 ? "egg" : "embryo";
  }
  const hatchingEnds = Math.min(new Date(job.babyAt).getTime(), hatch + 5 * 60 * 1000);
  if (current < hatchingEnds) return "hatching";
  if (current < new Date(job.babyAt).getTime()) return "fry";
  if (current < new Date(job.adultAt).getTime()) return "baby";
  return "adult";
}

export function resolveBreedingStatus(job: TimedJob, now: Date): BreedingJobView["status"] {
  if (job.status === "completed" || job.status === "cancelled") return job.status;
  const stage = resolveLifeStage(job, now);
  if (stage === "egg" || stage === "embryo") return "incubating";
  if (stage === "hatching") return "ready-to-hatch";
  if (stage === "fry") return "hatched";
  if (stage === "baby") return "growing";
  return "ready-to-grow";
}

export function developmentProgress(job: TimedJob, now: Date) {
  const start = new Date(job.startedAt).getTime();
  const end = new Date(job.adultAt).getTime();
  return Math.max(0, Math.min(1, (now.getTime() - start) / Math.max(1, end - start)));
}
