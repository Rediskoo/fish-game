import { type PrismaClient } from "@prisma/client";
import type { FriendView } from "@/types/game";

function toFriendView(friend: {
  friend: {
    id: string;
    telegramId: bigint;
    username: string | null;
    firstName: string | null;
    aquarium: { level: number } | null;
    fish: Array<{ id: string }>;
  };
}): FriendView {
  return {
    id: friend.friend.id,
    telegramId: friend.friend.telegramId.toString(),
    username: friend.friend.username,
    firstName: friend.friend.firstName,
    fishCount: friend.friend.fish.length,
    level: friend.friend.aquarium?.level ?? 1
  };
}

export class FriendsService {
  constructor(private readonly db: PrismaClient) {}

  async listFriends(userId: string) {
    const friends = await this.db.friend.findMany({
      where: { ownerId: userId },
      include: {
        friend: {
          include: {
            aquarium: true,
            fish: { select: { id: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return friends.map(toFriendView);
  }

  async addFriend(userId: string, telegramId: string) {
    const friendTelegramId = BigInt(telegramId);
    const currentUser = await this.db.user.findUniqueOrThrow({ where: { id: userId } });
    if (currentUser.telegramId === friendTelegramId) {
      throw new Error("You cannot add yourself");
    }

    const target = await this.db.user.findUnique({ where: { telegramId: friendTelegramId } });
    if (!target) {
      throw new Error("Account with this Telegram User ID was not found");
    }

    await this.db.friend.upsert({
      where: { ownerId_friendId: { ownerId: userId, friendId: target.id } },
      create: { ownerId: userId, friendId: target.id },
      update: {}
    });

    return this.listFriends(userId);
  }
}
