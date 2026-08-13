export const memorySymbols = ["🐟", "🐠", "🐡", "🦀", "🪸", "🫧"] as const;

export function calculateMemoryReward(moves: number) {
  return Math.max(20, 100 - Math.max(0, moves - memorySymbols.length) * 6);
}

export function hasValidPairs(cards: readonly string[]) {
  const counts = new Map<string, number>();
  cards.forEach((card) => counts.set(card, (counts.get(card) ?? 0) + 1));
  return cards.length === memorySymbols.length * 2 && [...counts.values()].every((count) => count === 2);
}
