import { FishOrigin, FishPersonality, FishSpecies, Rarity, TransactionType, type PrismaClient } from "@prisma/client";
import { GameRepository } from "@/server/repositories/game.repository";
import type { TelegramInitUser } from "@/lib/telegram/validate-init-data";
import type { AquariumSnapshot } from "@/types/game";
import { applyHungerDecay } from "@/server/services/hunger.service";
import { calculateFishIncome, claimOfflineIncome } from "@/server/services/income.service";
import { fishToView } from "@/server/services/fish.service";
import { evaluateAchievements } from "@/server/services/rewards.service";
import { shopProductsById } from "@/lib/app-assets";
import { aquariumFishCapacity } from "@/lib/fish-capacity";

const dailyRewardAmount = 100;

function nextUtcDay(date = new Date()) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export class PlayerService {
  private readonly repo: GameRepository;

  constructor(private readonly db: PrismaClient) {
    this.repo = new GameRepository(db);
  }

  async syncTelegramUser(telegramUser: TelegramInitUser) {
    let user = await this.repo.findUserByTelegramId(BigInt(telegramUser.id));

    if (!user) {
      user = await this.repo.createNewPlayer({
        telegramId: BigInt(telegramUser.id),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        photoUrl: telegramUser.photo_url
      });
    } else {
      await this.repo.updateTelegramUser(user.id, {
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        photoUrl: telegramUser.photo_url
      });
    }

    await claimOfflineIncome(this.db, user.id);
    return this.getSnapshot(user.id);
  }

  async getSnapshot(userId: string): Promise<AquariumSnapshot> {
    await applyHungerDecay(this.db, userId);
    let snapshot = await this.ensurePlayerState(userId);
    if (await this.accruePollution(userId, snapshot.aquarium)) {
      snapshot = await this.ensurePlayerState(userId);
    }
    if (!snapshot?.aquarium || !snapshot.inventory) {
      throw new Error("Player state is incomplete");
    }
    await evaluateAchievements(this.db, userId);

    const lastDailyReward = await this.db.dailyReward.findFirst({
      where: { ownerId: userId },
      orderBy: { claimedAt: "desc" }
    });
    const nextClaimAt = lastDailyReward ? nextUtcDay(lastDailyReward.claimedAt) : new Date(0);
    const claimedToday = nextClaimAt.getTime() > Date.now();

    const incomePerSecond = calculateFishIncome(snapshot.fish.slice(0, aquariumFishCapacity));
    const decor = Array.isArray(snapshot.aquarium.decor) ? snapshot.aquarium.decor.filter((item): item is string => typeof item === "string") : [];
    const ownedItemIds = await this.getOwnedItemIds(userId, decor, snapshot.aquarium.backgroundId);
    const achievements = await this.db.achievement.findMany({
      include: { users: { where: { ownerId: userId }, take: 1 } },
      orderBy: { createdAt: "asc" }
    });

    return {
      user: {
        id: snapshot.id,
        telegramId: snapshot.telegramId.toString(),
        username: snapshot.username,
        firstName: snapshot.firstName,
        currency: snapshot.currency,
        createdAt: snapshot.createdAt.toISOString()
      },
      aquarium: {
        id: snapshot.aquarium.id,
        name: snapshot.aquarium.name,
        level: snapshot.aquarium.level,
        experience: snapshot.aquarium.experience,
        lastIncomeAt: snapshot.aquarium.lastIncomeAt.toISOString(),
        backgroundId: snapshot.aquarium.backgroundId,
        decor,
        pollution: snapshot.aquarium.pollution
      },
      inventory: {
        food: snapshot.inventory.food,
        bigFood: snapshot.inventory.bigFood,
        superFood: snapshot.inventory.superFood,
        cleaner: snapshot.inventory.cleaner,
        superCleaner: snapshot.inventory.superCleaner,
        spawningNest: snapshot.inventory.spawningNest,
        eggIncubator: snapshot.inventory.eggIncubator,
        fryFood: snapshot.inventory.fryFood,
        nurseryConditioner: snapshot.inventory.nurseryConditioner,
        genealogyMedallion: snapshot.inventory.genealogyMedallion,
        ownedItemIds
      },
      dailyReward: {
        amount: dailyRewardAmount,
        claimedToday,
        nextClaimAt: nextClaimAt.toISOString()
      },
      achievements: achievements.map((achievement) => ({
        id: achievement.id,
        key: achievement.key,
        title: achievement.title,
        description: achievement.description,
        reward: achievement.reward,
        unlockedAt: achievement.users[0]?.unlockedAt.toISOString() ?? null
      })),
      fish: snapshot.fish.map(fishToView),
      incomePerSecond,
      offlineIncome: 0
    };
  }

  private async ensurePlayerState(userId: string) {
    let snapshot = await this.repo.findUserSnapshot(userId);
    if (!snapshot) {
      throw new Error("Player not found");
    }

    if (snapshot.aquarium && snapshot.inventory && snapshot.fish.length > 0) {
      return snapshot;
    }

    const playerName = snapshot.firstName ?? "My";
    await this.db.$transaction(async (tx) => {
      const starterType = await tx.fishType.upsert({
        where: { species_rarity: { species: FishSpecies.GOLDFISH, rarity: Rarity.COMMON } },
        create: {
          species: FishSpecies.GOLDFISH,
          rarity: Rarity.COMMON,
          displayName: "Р—РѕР»РѕС‚Р°СЏ СЂС‹Р±РєР°",
          dropChanceBps: 2500,
          incomePerSecond: 1.2,
          swimSpeed: 58,
          hungerPerMinute: 1,
          maxHunger: 100,
          experienceReward: 25,
          color: "#ffb02e",
          glowColor: "#ffd166"
        },
        update: {}
      });

      await tx.aquarium.upsert({
        where: { ownerId: userId },
        create: { ownerId: userId, name: `${playerName} Aquarium` },
        update: {}
      });

      await tx.inventory.upsert({
        where: { ownerId: userId },
        create: { ownerId: userId, food: 5, cleaner: 0 },
        update: {}
      });

      const fishCount = await tx.fish.count({ where: { ownerId: userId, isGiftLocked: false } });
      if (fishCount === 0) {
        await tx.fish.create({
          data: {
            ownerId: userId,
            fishTypeId: starterType.id,
            name: "Bubbles",
            swimSpeed: starterType.swimSpeed,
            personality: FishPersonality.CURIOUS,
            origin: FishOrigin.STARTER,
            animationState: { x: 0.3, y: 0.5, direction: 1 }
          }
        });
      }
    });

    snapshot = await this.repo.findUserSnapshot(userId);
    if (!snapshot) {
      throw new Error("Player not found");
    }
    return snapshot;
  }

  private async getOwnedItemIds(userId: string, activeDecor: string[], activeBackgroundId: string) {
    const purchases = await this.db.transaction.findMany({
      where: { ownerId: userId, type: TransactionType.PURCHASE_ITEM },
      select: { metadata: true }
    });
    const owned = new Set<string>(["deep-lagoon", activeBackgroundId, ...activeDecor]);
    for (const purchase of purchases) {
      const metadata = purchase.metadata;
      if (metadata && typeof metadata === "object" && !Array.isArray(metadata) && "productId" in metadata) {
        const productId = metadata.productId;
        if (typeof productId === "string") owned.add(productId);
      }
    }
    return [...owned].filter((id) => {
      const product = shopProductsById[id];
      return id === "deep-lagoon" || product?.category === "decor" || product?.category === "backgrounds";
    });
  }


  async buyProduct(userId: string, productId: string) {
    const product = shopProductsById[productId];
    if (!product || product.id === "fish-case") throw new Error("Invalid marketplace product");

    const foodAmount = product.id === "food-basic" ? 10 : product.id === "food-premium" ? 25 : 0;
    const bigFoodAmount = product.id === "food-large" ? 1 : 0;
    const superFoodAmount = product.id === "food-aquarium" ? 1 : 0;
    const cleanerAmount = product.id === "water-conditioner" ? 1 : 0;
    const superCleanerAmount = product.id === "big-water-cleaner" ? 1 : 0;
    const breedingItem = {
      "spawning-nest": "spawningNest",
      "egg-incubator": "eggIncubator",
      "fry-food": "fryFood",
      "nursery-conditioner": "nurseryConditioner",
      "genealogy-medallion": "genealogyMedallion"
    }[product.id] as "spawningNest" | "eggIncubator" | "fryFood" | "nurseryConditioner" | "genealogyMedallion" | undefined;

    return this.db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.currency < product.price) throw new Error("Not enough algae");

      const aquarium = await tx.aquarium.findUniqueOrThrow({ where: { ownerId: userId } });
      const currentDecor = Array.isArray(aquarium.decor) ? aquarium.decor.filter((item): item is string => typeof item === "string") : [];
      const purchases = await tx.transaction.findMany({
        where: { ownerId: userId, type: TransactionType.PURCHASE_ITEM },
        select: { metadata: true }
      });
      const alreadyOwned = purchases.some((purchase) => {
        const metadata = purchase.metadata;
        return metadata && typeof metadata === "object" && !Array.isArray(metadata) && "productId" in metadata && metadata.productId === product.id;
      });
      if (!product.repeatable && (alreadyOwned || currentDecor.includes(product.id) || aquarium.backgroundId === product.id)) {
        throw new Error("Item already owned");
      }

      await tx.user.update({ where: { id: userId }, data: { currency: { decrement: product.price } } });

      if (product.category === "care") {
        await tx.inventory.update({ where: { ownerId: userId }, data: { food: { increment: foodAmount }, bigFood: { increment: bigFoodAmount }, superFood: { increment: superFoodAmount }, cleaner: { increment: cleanerAmount }, superCleaner: { increment: superCleanerAmount } } });
      } else if (product.category === "breeding" && breedingItem) {
        await tx.inventory.update({ where: { ownerId: userId }, data: { [breedingItem]: { increment: 1 } } });
      } else if (product.category === "decor") {
        await tx.aquarium.update({ where: { ownerId: userId }, data: { decor: [...currentDecor, product.id] } });
      } else if (product.category === "backgrounds") {
        await tx.aquarium.update({ where: { ownerId: userId }, data: { backgroundId: product.id } });
      }

      await tx.transaction.create({
        data: {
          ownerId: userId,
          type: product.category === "breeding" ? TransactionType.PURCHASE_BREEDING_ITEM : TransactionType.PURCHASE_ITEM,
          amount: -product.price,
          metadata: { productId: product.id, category: product.category }
        }
      });
    });
  }
  private async accruePollution(userId: string, aquarium: { pollution: number; lastPollutionAt: Date } | null) {
    if (!aquarium) return false;
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - aquarium.lastPollutionAt.getTime()) / 60000);
    if (elapsedMinutes <= 0) return false;
    await this.db.aquarium.update({
      where: { ownerId: userId },
      data: {
        pollution: Math.min(80, aquarium.pollution + elapsedMinutes),
        lastPollutionAt: now
      }
    });
    return true;
  }

  async cleanAquarium(userId: string, superClean = false) {
    await this.db.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUniqueOrThrow({ where: { ownerId: userId } });
      if (superClean ? inventory.superCleaner <= 0 : inventory.cleaner <= 0) throw new Error("Нет нужного очистителя");
      const aquarium = await tx.aquarium.findUniqueOrThrow({ where: { ownerId: userId } });
      await tx.inventory.update({ where: { ownerId: userId }, data: superClean ? { superCleaner: { decrement: 1 } } : { cleaner: { decrement: 1 } } });
      await tx.aquarium.update({
        where: { ownerId: userId },
        data: { pollution: superClean ? 0 : Math.max(0, aquarium.pollution - 15), lastPollutionAt: new Date() }
      });
    });
  }

  async customizeAquarium(userId: string, input: { decorId?: string; enabled?: boolean; backgroundId?: string }) {
    const backgroundProduct = input.backgroundId ? shopProductsById[input.backgroundId] : null;
    if (input.backgroundId && (!backgroundProduct || backgroundProduct.category !== "backgrounds")) {
      throw new Error("Invalid background");
    }

    const decorProduct = input.decorId ? shopProductsById[input.decorId] : null;
    if (input.decorId && (!decorProduct || decorProduct.category !== "decor")) {
      throw new Error("Invalid decor");
    }

    await this.db.$transaction(async (tx) => {
      const aquarium = await tx.aquarium.findUniqueOrThrow({ where: { ownerId: userId } });
      const currentDecor = Array.isArray(aquarium.decor) ? aquarium.decor.filter((item): item is string => typeof item === "string") : [];
      const purchases = await tx.transaction.findMany({
        where: { ownerId: userId, type: TransactionType.PURCHASE_ITEM },
        select: { metadata: true }
      });
      const owned = new Set<string>(["deep-lagoon", aquarium.backgroundId, ...currentDecor]);
      for (const purchase of purchases) {
        const metadata = purchase.metadata;
        if (metadata && typeof metadata === "object" && !Array.isArray(metadata) && "productId" in metadata && typeof metadata.productId === "string") {
          owned.add(metadata.productId);
        }
      }
      const data: { backgroundId?: string; decor?: string[] } = {};

      if (backgroundProduct) {
        if (!owned.has(backgroundProduct.id)) throw new Error("Background is not owned");
        data.backgroundId = backgroundProduct.id;
      }

      if (decorProduct) {
        const enabled = input.enabled ?? !currentDecor.includes(decorProduct.id);
        if (enabled && !owned.has(decorProduct.id)) throw new Error("Decor is not owned");
        data.decor = enabled ? [...new Set([...currentDecor, decorProduct.id])].slice(0, 8) : currentDecor.filter((id) => id !== decorProduct.id);
      }

      if (Object.keys(data).length > 0) {
        await tx.aquarium.update({ where: { ownerId: userId }, data });
      }
    });
  }

  async buyFood(userId: string, amount: number) {
    if (amount < 1 || amount > 999) throw new Error("Invalid food amount");
    return this.db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.currency < amount) throw new Error("Not enough algae");
      await tx.user.update({ where: { id: userId }, data: { currency: { decrement: amount } } });
      await tx.inventory.update({ where: { ownerId: userId }, data: { food: { increment: amount } } });
      await tx.transaction.create({
        data: { ownerId: userId, type: TransactionType.PURCHASE_FOOD, amount: -amount, metadata: { food: amount } }
      });
    });
  }
}
