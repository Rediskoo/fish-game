import { randomInt } from "node:crypto";
import { TransactionType, type Prisma, type PrismaClient } from "@prisma/client";
import { ensureLatestSchema } from "@/server/services/schema-compat.service";
import { calculateMemoryReward, memorySymbols } from "@/features/games/memory-game";

const gameDurationMs = 3 * 60_000;
const cooldownMs = 30_000;

function shuffledCards() {
  const cards = [...memorySymbols, ...memorySymbols];
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
}

function numberArray(value: Prisma.JsonValue): number[] {
  return Array.isArray(value) ? value.filter((item): item is number => Number.isInteger(item)) : [];
}

export class MatchThreeService {
  constructor(private readonly db: PrismaClient) {}

  async start(userId: string, now = new Date()) {
    await ensureLatestSchema(this.db);
    return this.db.$transaction(async (tx) => {
      const active = await tx.memoryGame.findFirst({ where: { ownerId: userId, status: "ACTIVE", expiresAt: { gt: now } }, orderBy: { startedAt: "desc" } });
      if (active) return this.view(active);
      await tx.memoryGame.updateMany({ where: { ownerId: userId, status: "ACTIVE", expiresAt: { lte: now } }, data: { status: "EXPIRED" } });
      const last = await tx.transaction.findFirst({ where: { ownerId: userId, type: TransactionType.MATCH_THREE_REWARD }, orderBy: { createdAt: "desc" } });
      const waitMs = last ? cooldownMs - (now.getTime() - last.createdAt.getTime()) : 0;
      if (waitMs > 0) throw new Error(`Новая партия через ${Math.ceil(waitMs / 1000)} сек.`);
      const game = await tx.memoryGame.create({ data: { ownerId: userId, cards: shuffledCards(), matchedIndices: [], expiresAt: new Date(now.getTime() + gameDurationMs) } });
      return this.view(game);
    }, { isolationLevel: "Serializable" });
  }

  async flip(userId: string, gameId: string, index: number, now = new Date()) {
    await ensureLatestSchema(this.db);
    return this.db.$transaction(async (tx) => {
      const game = await tx.memoryGame.findFirst({ where: { id: gameId, ownerId: userId } });
      if (!game || game.status !== "ACTIVE") throw new Error("Эта партия уже закончена");
      if (now >= game.expiresAt) { await tx.memoryGame.update({ where: { id: game.id }, data: { status: "EXPIRED" } }); throw new Error("Время вышло — начинай новую партию"); }
      const cards = game.cards as string[];
      const matched = numberArray(game.matchedIndices);
      if (index < 0 || index >= cards.length || matched.includes(index)) throw new Error("Эту карточку переворачивать нельзя");
      if (game.firstCard === null) {
        const updated = await tx.memoryGame.update({ where: { id: game.id }, data: { firstCard: index } });
        return { ...this.view(updated), revealed: [{ index, symbol: cards[index] }], pairMatched: null };
      }
      if (game.firstCard === index) throw new Error("Выбери другую карточку");
      const first = game.firstCard;
      const pairMatched = cards[first] === cards[index];
      const nextMatched = pairMatched ? [...matched, first, index] : matched;
      const moves = game.moves + 1;
      const completed = nextMatched.length === cards.length;
      const reward = completed ? calculateMemoryReward(moves) : 0;
      const updated = await tx.memoryGame.update({ where: { id: game.id }, data: { firstCard: null, moves, matchedIndices: nextMatched, status: completed ? "COMPLETED" : "ACTIVE", completedAt: completed ? now : null, reward } });
      if (completed) {
        await tx.user.update({ where: { id: userId }, data: { currency: { increment: reward } } });
        await tx.transaction.create({ data: { ownerId: userId, type: TransactionType.MATCH_THREE_REWARD, amount: reward, metadata: { game: "memory-pairs", gameId: game.id, moves } } });
      }
      return { ...this.view(updated), revealed: [{ index: first, symbol: cards[first] }, { index, symbol: cards[index] }], pairMatched };
    }, { isolationLevel: "Serializable" });
  }

  private view(game: { id: string; cards: Prisma.JsonValue; matchedIndices: Prisma.JsonValue; firstCard: number | null; moves: number; status: string; expiresAt: Date; reward: number }) {
    const cards = game.cards as string[];
    const matchedIndices = numberArray(game.matchedIndices);
    return { gameId: game.id, cardCount: cards.length, matchedIndices, moves: game.moves, status: game.status.toLowerCase(), expiresAt: game.expiresAt.toISOString(), reward: game.reward, revealed: game.firstCard === null ? [] : [{ index: game.firstCard, symbol: cards[game.firstCard] }], pairMatched: null as boolean | null };
  }
}
