import { FriendRequestStatus, GiftType, TransactionType, type FishType, type PrismaClient } from "@prisma/client";
import type { FriendRequestView, FriendView } from "@/types/game";
import { createOwnedFish, fishToAcquiredView, fishToView } from "@/server/services/fish.service";
import { fishCost } from "@/server/services/marketplace.service";
import { evaluateAchievements } from "@/server/services/rewards.service";
import { notifyAquariumVisit, notifyFriendRequest, notifyGift } from "@/lib/telegram/bot";
import { ensureLatestSchema } from "@/server/services/schema-compat.service";

const algaeGiftAmounts: Partial<Record<GiftType, number>> = {
  ALGAE_25: 25,
  ALGAE_50: 50,
  ALGAE_75: 75,
  ALGAE_100: 100
};

const giftNotificationLabels: Record<GiftType, string> = {
  FISH_CASE: "кейс с рыбкой",
  OWNED_FISH: "рыбка из аквариума",
  ALGAE_25: "25 водорослей",
  ALGAE_50: "50 водорослей",
  ALGAE_75: "75 водорослей",
  ALGAE_100: "100 водорослей"
};

function displayName(user: { firstName: string | null; username: string | null }) {
  return user.firstName ?? (user.username ? `@${user.username}` : "Друг");
}

function pickWeighted(types: FishType[]) {
  const total = types.reduce((sum, type) => sum + type.dropChanceBps, 0);
  let roll = Math.floor(Math.random() * total);
  for (const type of types) {
    roll -= type.dropChanceBps;
    if (roll <= 0) return type;
  }
  return types[0];
}

function toFriendView(friend: {
  friend: {
    id: string;
    telegramId: bigint;
    username: string | null;
    firstName: string | null;
    profileName: string | null;
    profileBio: string | null;
    profileAvatar: string | null;
    aquarium: { level: number } | null;
    fish: Array<Parameters<typeof fishToView>[0]>;
    receivedGifts: Array<{ createdAt: Date }>;
    sentGifts: Array<{
      id: string;
      type: GiftType;
      amount: number;
      fishId: string | null;
      createdAt: Date;
      fish: Parameters<typeof fishToAcquiredView>[0] | null;
      sender: {
        id: string;
        telegramId: bigint;
        username: string | null;
        firstName: string | null;
      };
    }>;
  };
  createdAt: Date;
}): FriendView {
  const pendingGift = friend.friend.sentGifts[0] ?? null;
  return {
    id: friend.friend.id,
    telegramId: friend.friend.telegramId.toString(),
    username: friend.friend.username,
    firstName: friend.friend.firstName,
    profileName: friend.friend.profileName,
    profileBio: friend.friend.profileBio,
    profileAvatar: friend.friend.profileAvatar,
    fishCount: friend.friend.fish.length,
    level: friend.friend.aquarium?.level ?? 1,
    friendsSince: friend.createdAt.toISOString(),
    lastGiftAt: friend.friend.receivedGifts[0]?.createdAt.toISOString() ?? null,
    pendingGift: pendingGift
      ? {
          id: pendingGift.id,
          type: pendingGift.type,
          amount: pendingGift.amount,
          fishId: pendingGift.fishId,
          fish: pendingGift.fish ? fishToAcquiredView(pendingGift.fish) : null,
          createdAt: pendingGift.createdAt.toISOString(),
          sender: {
            id: pendingGift.sender.id,
            telegramId: pendingGift.sender.telegramId.toString(),
            username: pendingGift.sender.username,
            firstName: pendingGift.sender.firstName
          }
        }
      : null,
    fish: friend.friend.fish.map(fishToView)
  };
}

function toRequestView(userId: string, request: {
  id: string;
  senderId: string;
  createdAt: Date;
  sender: { telegramId: bigint; username: string | null; firstName: string | null };
  receiver: { telegramId: bigint; username: string | null; firstName: string | null };
}): FriendRequestView {
  const incoming = request.senderId !== userId;
  const user = incoming ? request.sender : request.receiver;
  return {
    id: request.id,
    direction: incoming ? "incoming" : "outgoing",
    telegramId: user.telegramId.toString(),
    username: user.username,
    firstName: user.firstName,
    createdAt: request.createdAt.toISOString()
  };
}

export class FriendsService {
  constructor(private readonly db: PrismaClient) {}

  async getFriendsPayload(userId: string) {
    await ensureLatestSchema(this.db);
    const [friends, requests] = await Promise.all([
      this.db.friend.findMany({
        where: { ownerId: userId },
        include: {
          friend: {
            include: {
              aquarium: true,
              fish: { where: { isGiftLocked: false }, include: { fishType: true }, orderBy: { createdAt: "asc" } },
              receivedGifts: {
                where: { senderId: userId },
                orderBy: { createdAt: "desc" },
                take: 1
              },
              sentGifts: {
                where: { receiverId: userId, claimedAt: null },
                include: {
                  fish: { include: { fishType: true } },
                  sender: { select: { id: true, telegramId: true, username: true, firstName: true } }
                },
                orderBy: { createdAt: "desc" },
                take: 1
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      this.db.friendRequest.findMany({
        where: {
          status: FriendRequestStatus.PENDING,
          OR: [{ senderId: userId }, { receiverId: userId }]
        },
        include: {
          sender: { select: { telegramId: true, username: true, firstName: true } },
          receiver: { select: { telegramId: true, username: true, firstName: true } }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    return {
      friends: friends.map(toFriendView),
      requests: requests.map((request) => toRequestView(userId, request))
    };
  }

  async createFriendRequest(userId: string, telegramId: string) {
    const friendTelegramId = BigInt(telegramId);
    const currentUser = await this.db.user.findUniqueOrThrow({ where: { id: userId } });
    if (currentUser.telegramId === friendTelegramId) throw new Error("You cannot add yourself");

    const target = await this.db.user.findUnique({ where: { telegramId: friendTelegramId } });
    if (!target) throw new Error("Account with this Telegram User ID was not found");

    const existingFriend = await this.db.friend.findUnique({
      where: { ownerId_friendId: { ownerId: userId, friendId: target.id } }
    });
    if (existingFriend) throw new Error("This user is already your friend");

    const reverseRequest = await this.db.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: target.id, receiverId: userId } }
    });
    if (reverseRequest?.status === FriendRequestStatus.PENDING) {
      await this.acceptFriendRequest(userId, reverseRequest.id);
      return this.getFriendsPayload(userId);
    }

    await this.db.friendRequest.upsert({
      where: { senderId_receiverId: { senderId: userId, receiverId: target.id } },
      create: { senderId: userId, receiverId: target.id },
      update: { status: FriendRequestStatus.PENDING }
    });
    await notifyFriendRequest(target.telegramId, displayName(currentUser));

    return this.getFriendsPayload(userId);
  }

  async acceptFriendRequest(userId: string, requestId: string) {
    await this.db.$transaction(async (tx) => {
      const request = await tx.friendRequest.findUniqueOrThrow({ where: { id: requestId } });
      if (request.receiverId !== userId) throw new Error("Only receiver can accept this request");
      if (request.status !== FriendRequestStatus.PENDING) throw new Error("Friend request is not pending");

      await tx.friendRequest.update({ where: { id: requestId }, data: { status: FriendRequestStatus.ACCEPTED } });
      await tx.friend.upsert({
        where: { ownerId_friendId: { ownerId: request.senderId, friendId: request.receiverId } },
        create: { ownerId: request.senderId, friendId: request.receiverId },
        update: {}
      });
      await tx.friend.upsert({
        where: { ownerId_friendId: { ownerId: request.receiverId, friendId: request.senderId } },
        create: { ownerId: request.receiverId, friendId: request.senderId },
        update: {}
      });
      await evaluateAchievements(tx, request.senderId);
      await evaluateAchievements(tx, request.receiverId);
    });

    return this.getFriendsPayload(userId);
  }

  async declineFriendRequest(userId: string, requestId: string) {
    const request = await this.db.friendRequest.findUniqueOrThrow({ where: { id: requestId } });
    if (request.receiverId !== userId) throw new Error("Only receiver can decline this request");
    await this.db.friendRequest.update({ where: { id: requestId }, data: { status: FriendRequestStatus.DECLINED } });
    return this.getFriendsPayload(userId);
  }

  async removeFriend(userId: string, friendId: string) {
    await this.db.$transaction([
      this.db.friend.deleteMany({ where: { ownerId: userId, friendId } }),
      this.db.friend.deleteMany({ where: { ownerId: friendId, friendId: userId } })
    ]);
    return this.getFriendsPayload(userId);
  }

  async sendGift(userId: string, friendId: string, type: GiftType, fishId?: string) {
    const notification = await this.db.$transaction(async (tx) => {
      const friendship = await tx.friend.findUnique({ where: { ownerId_friendId: { ownerId: userId, friendId } } });
      if (!friendship) throw new Error("This user is not your friend");
      const [sender, receiver] = await Promise.all([
        tx.user.findUniqueOrThrow({ where: { id: userId }, select: { firstName: true, username: true } }),
        tx.user.findUniqueOrThrow({ where: { id: friendId }, select: { telegramId: true } })
      ]);

      const amount = algaeGiftAmounts[type] ?? 0;
      const cost = type === GiftType.FISH_CASE ? fishCost : amount;
      let giftFishId: string | undefined;

      if (type === GiftType.OWNED_FISH) {
        if (!fishId) throw new Error("fishId is required for fish gift");
        const fishCount = await tx.fish.count({ where: { ownerId: userId, isGiftLocked: false } });
        if (fishCount <= 1) throw new Error("You cannot gift your last fish");
        const fish = await tx.fish.findFirst({ where: { id: fishId, ownerId: userId, isGiftLocked: false, breedingLocked: false } });
        if (!fish) throw new Error("Fish not found");
        await tx.fish.update({ where: { id: fish.id }, data: { isGiftLocked: true } });
        giftFishId = fish.id;
      } else {
        const senderBalance = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        if (senderBalance.currency < cost) throw new Error("Not enough algae for this gift");
        await tx.user.update({ where: { id: userId }, data: { currency: { decrement: cost } } });
      }

      await tx.friendGift.create({ data: { senderId: userId, receiverId: friendId, type, amount, fishId: giftFishId } });
      await tx.transaction.create({
        data: { ownerId: userId, type: TransactionType.GIFT_SENT, amount: -cost, metadata: { friendId, giftType: type, fishId: giftFishId } }
      });
      await evaluateAchievements(tx, userId);
      return { targetTelegramId: receiver.telegramId, senderName: displayName(sender) };
    });

    await notifyGift(notification.targetTelegramId, notification.senderName, giftNotificationLabels[type]);

    return this.getFriendsPayload(userId);
  }

  async recordAquariumVisit(visitorId: string, ownerId: string) {
    if (visitorId === ownerId) throw new Error("You cannot visit your own aquarium");
    const friendship = await this.db.friend.findUnique({ where: { ownerId_friendId: { ownerId: visitorId, friendId: ownerId } } });
    if (!friendship) throw new Error("This user is not your friend");

    const [visitor, owner] = await Promise.all([
      this.db.user.findUniqueOrThrow({ where: { id: visitorId }, select: { firstName: true, username: true } }),
      this.db.user.findUniqueOrThrow({ where: { id: ownerId }, select: { telegramId: true } })
    ]);
    const period = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    const key = `visit:${visitorId}:${ownerId}:${period}`;
    try {
      await this.db.botNotification.create({ data: { key } });
    } catch {
      return;
    }
    if (!(await notifyAquariumVisit(owner.telegramId, displayName(visitor)))) {
      await this.db.botNotification.delete({ where: { key } }).catch(() => undefined);
    }
  }

  async claimGift(userId: string, giftId: string) {
    const result = await this.db.$transaction(async (tx) => {
      const gift = await tx.friendGift.findFirst({
        where: { id: giftId, receiverId: userId, claimedAt: null }
      });
      if (!gift) throw new Error("Gift is already claimed or unavailable");
      const now = new Date();
      let acquiredFish = null;

      if (gift.type === GiftType.FISH_CASE) {
        const types = await tx.fishType.findMany();
        if (types.length === 0) throw new Error("Fish catalog is empty");
        const selected = pickWeighted(types);
        const fish = await createOwnedFish(tx, userId, selected);
        acquiredFish = fishToAcquiredView(fish);
      } else if (gift.type === GiftType.OWNED_FISH) {
        if (!gift.fishId) throw new Error("Gift fish was not found");
        const giftFish = await tx.fish.findFirst({
          where: { id: gift.fishId, ownerId: gift.senderId, isGiftLocked: true }
        });
        if (!giftFish) throw new Error("Gift fish was already moved or is unavailable");
        const fish = await tx.fish.update({
          where: { id: giftFish.id },
          data: {
            ownerId: userId,
            isGiftLocked: false,
            isFavorite: false,
            animationState: { x: Math.random(), y: Math.random(), direction: Math.random() > 0.5 ? 1 : -1 }
          },
          include: { fishType: true }
        });
        acquiredFish = fishToAcquiredView(fish);
      } else {
        await tx.user.update({ where: { id: userId }, data: { currency: { increment: gift.amount } } });
      }

      await tx.friendGift.update({ where: { id: gift.id }, data: { claimedAt: now } });
      await tx.transaction.create({
        data: {
          ownerId: userId,
          type: TransactionType.GIFT_RECEIVED,
          amount: gift.type === GiftType.FISH_CASE ? 0 : gift.amount,
          metadata: { senderId: gift.senderId, giftType: gift.type, giftId: gift.id }
        }
      });
      await evaluateAchievements(tx, userId);

      return { acquiredFish };
    });

    return {
      friends: await this.getFriendsPayload(userId),
      acquiredFish: result.acquiredFish
    };
  }
}
