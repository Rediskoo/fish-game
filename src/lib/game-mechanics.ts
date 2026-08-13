export const MAX_OFFLINE_SECONDS = 60 * 60 * 24 * 7;
export const FEED_HUNGER_REDUCTION = 10;

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function hungerIncomeMultiplier(hunger: number, maxHunger: number) {
  if (maxHunger <= 0) return 0;
  const hungerPercent = (clamp(hunger, 0, maxHunger) / maxHunger) * 100;
  if (hungerPercent >= 90) return 0.25;
  if (hungerPercent >= 70) return 0.6;
  return 1;
}

export function calculateFishIncome(fish: Array<{ fishType: { incomePerSecond: number; maxHunger: number }; hunger: number; incomeMultiplier: number }>) {
  return fish.reduce((sum, item) => (
    sum + item.fishType.incomePerSecond * item.incomeMultiplier * hungerIncomeMultiplier(item.hunger, item.fishType.maxHunger)
  ), 0);
}

export function calculateOfflineSeconds(lastIncomeAt: Date, now = new Date()) {
  const elapsed = Math.floor((now.getTime() - lastIncomeAt.getTime()) / 1000);
  return clamp(elapsed, 0, MAX_OFFLINE_SECONDS);
}

export function calculateHunger(
  currentHunger: number,
  maxHunger: number,
  hungerPerMinute: number,
  elapsedMinutes: number
) {
  return clamp(currentHunger + Math.max(0, elapsedMinutes) * Math.max(0, hungerPerMinute), 0, maxHunger);
}

export function feedHunger(currentHunger: number) {
  return Math.max(0, currentHunger - FEED_HUNGER_REDUCTION);
}
