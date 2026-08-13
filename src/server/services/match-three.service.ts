import { randomInt } from "node:crypto";
import { TransactionType, type PrismaClient } from "@prisma/client";
import { ensureLatestSchema } from "@/server/services/schema-compat.service";

const symbols = ["🐟", "🐠", "🫧", "🌿", "🪸"] as const;
const cooldownMs = 30_000;

function countMatches(board: string[][]) {
  let matches = 0;
  for (let row = 0; row < 6; row += 1) for (let column = 0; column < 4; column += 1) {
    if (board[row][column] === board[row][column + 1] && board[row][column] === board[row][column + 2]) matches += 1;
    if (board[column][row] === board[column + 1][row] && board[column][row] === board[column + 2][row]) matches += 1;
  }
  return matches;
}

export class MatchThreeService {
  constructor(private readonly db: PrismaClient) {}

  async play(userId: string, now = new Date()) {
    await ensureLatestSchema(this.db);
    return this.db.$transaction(async (tx) => {
      const last = await tx.transaction.findFirst({ where: { ownerId: userId, type: TransactionType.MATCH_THREE_REWARD }, orderBy: { createdAt: "desc" } });
      const waitMs = last ? cooldownMs - (now.getTime() - last.createdAt.getTime()) : 0;
      if (waitMs > 0) throw new Error(`Следующая партия через ${Math.ceil(waitMs / 1000)} сек.`);
      const board = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => symbols[randomInt(symbols.length)]));
      const matches = countMatches(board);
      const reward = Math.min(75, 5 + matches * 5);
      await tx.user.update({ where: { id: userId }, data: { currency: { increment: reward } } });
      await tx.transaction.create({ data: { ownerId: userId, type: TransactionType.MATCH_THREE_REWARD, amount: reward, metadata: { matches, board } } });
      return { board, matches, reward, nextPlayAt: new Date(now.getTime() + cooldownMs).toISOString() };
    }, { isolationLevel: "Serializable" });
  }
}
