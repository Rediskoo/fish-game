import type { FishSpecies } from "@prisma/client";
import manifest from "./pocket-aquarium-manifest.json";

type AssetKey = keyof typeof manifest.assets;
type AnimationKey = keyof typeof manifest.animations;

const publicRoot = "/pocket-aquarium-assets/";

function assetFile(key: AssetKey, preferred: "webp2x" | "webp1x" | "png2x" = "webp2x") {
  const entry = manifest.assets[key] as {
    files?: Partial<Record<"webp2x" | "webp1x" | "png2x", string>>;
    file?: string;
  };
  const file = entry.files?.[preferred] ?? entry.files?.webp1x ?? entry.files?.png2x ?? entry.file;
  if (!file) throw new Error(`Missing asset file for ${key}`);
  return publicRoot + file.replace(/\\/g, "/");
}

function animationFile(key: AnimationKey, animated = false) {
  const entry = manifest.animations[key] as { file: string; animatedFile?: string };
  return publicRoot + (animated && entry.animatedFile ? entry.animatedFile : entry.file).replace(/\\/g, "/");
}

export const aquariumAssets = {
  categories: {
    storage: {
      foodCare: assetFile("categories.storage.food-care"),
      decor: assetFile("categories.storage.decor"),
      backgrounds: assetFile("categories.storage.backgrounds"),
      fish: assetFile("categories.storage.fish")
    },
    shop: {
      foodCare: assetFile("categories.shop.food-care"),
      decor: assetFile("categories.shop.decor"),
      backgrounds: assetFile("categories.shop.backgrounds"),
      fishCases: assetFile("categories.shop.fish-cases")
    }
  },
  items: {
    foodPelletJar: assetFile("items.food-pellet-jar"),
    foodFlakesPouch: assetFile("items.food-flakes-pouch"),
    vitaminDrops: assetFile("items.vitamin-drops"),
    waterCleaner: assetFile("items.water-cleaner"),
    plantSmall: assetFile("items.plant-small"),
    plantTall: assetFile("items.plant-tall"),
    coralRed: assetFile("items.coral-red"),
    coralViolet: assetFile("items.coral-violet"),
    stoneBridge: assetFile("items.stone-bridge"),
    pagodaLantern: assetFile("items.pagoda-lantern"),
    pebbleCave: assetFile("items.pebble-cave"),
    treasureAmphora: assetFile("items.treasure-amphora")
  },
  fish: {
    goldfish: assetFile("fish.goldfish"),
    betta: assetFile("fish.betta"),
    angelfish: assetFile("fish.angelfish"),
    clownfish: assetFile("fish.clownfish"),
    neonTetra: assetFile("fish.neon-tetra"),
    guppy: assetFile("fish.guppy"),
    dwarfGourami: assetFile("fish.dwarf-gourami"),
    discus: assetFile("fish.discus"),
    emeraldDragonfish: assetFile("fish.emerald-dragonfish"),
    celestialKoi: assetFile("fish.celestial-koi"),
    crystalTang: assetFile("fish.crystal-tang"),
    midnightManta: assetFile("fish.midnight-manta")
  },
  profile: {
    avatarDiver: assetFile("profile.avatar-diver"),
    avatarFrame: assetFile("profile.avatar-frame")
  },
  rewards: {
    dailyGiftClosed: assetFile("rewards.daily-gift-closed"),
    dailyGiftOpen: assetFile("rewards.daily-gift-open"),
    questScroll: assetFile("rewards.quest-scroll"),
    favorite: assetFile("rewards.favorite"),
    friends: assetFile("rewards.friends"),
    lockedMystery: assetFile("rewards.locked-mystery")
  },
  achievements: {
    firstFish: assetFile("achievements.first-fish"),
    caretaker: assetFile("achievements.caretaker"),
    collector: assetFile("achievements.collector"),
    masterAquarist: assetFile("achievements.master-aquarist")
  },
  backgrounds: {
    deepLagoon: assetFile("backgrounds.deep-lagoon"),
    coralGarden: assetFile("backgrounds.coral-garden"),
    moonlitReef: assetFile("backgrounds.moonlit-reef"),
    sunkenTemple: assetFile("backgrounds.sunken-temple"),
    tropicalRiver: assetFile("backgrounds.tropical-river"),
    nightGrotto: assetFile("backgrounds.night-grotto")
  },
  icons: {
    navigation: {
      home: { active: assetFile("icons.navigation.home.active"), inactive: assetFile("icons.navigation.home.inactive") },
      storage: { active: assetFile("icons.navigation.storage.active"), inactive: assetFile("icons.navigation.storage.inactive") },
      shop: { active: assetFile("icons.navigation.shop.active"), inactive: assetFile("icons.navigation.shop.inactive") },
      gifts: { active: assetFile("icons.navigation.gifts.active"), inactive: assetFile("icons.navigation.gifts.inactive") },
      profile: { active: assetFile("icons.navigation.profile.active"), inactive: assetFile("icons.navigation.profile.inactive") },
      settings: { active: assetFile("icons.navigation.settings.active"), inactive: assetFile("icons.navigation.settings.inactive") }
    },
    ui: {
      food: assetFile("icons.ui.food"),
      care: assetFile("icons.ui.care"),
      decor: assetFile("icons.ui.decor"),
      backgrounds: assetFile("icons.ui.backgrounds"),
      fishCases: assetFile("icons.ui.fish-cases"),
      currencyCoin: assetFile("icons.ui.currency-coin"),
      favorite: assetFile("icons.ui.favorite"),
      friends: assetFile("icons.ui.friends"),
      level: assetFile("icons.ui.level"),
      achievement: assetFile("icons.ui.achievement"),
      eye: assetFile("icons.ui.eye"),
      eyeOff: assetFile("icons.ui.eye-off"),
      cleanliness: assetFile("icons.ui.cleanliness"),
      satiety: assetFile("icons.ui.satiety"),
      capacity: assetFile("icons.ui.capacity"),
      notification: assetFile("icons.ui.notification"),
      sound: assetFile("icons.ui.sound")
    }
  }
} as const;

export const aquariumAnimations = {
  bubbles: animationFile("bubbles"),
  sparkleGlow: animationFile("sparkle-glow"),
  feeding: animationFile("feeding"),
  waterCleaning: animationFile("water-cleaning"),
  rewardReveal: animationFile("reward-reveal"),
  caseOpening: animationFile("case-opening"),
  fishSwim: {
    goldfish: animationFile("fish-swim-goldfish", true),
    betta: animationFile("fish-swim-betta", true),
    angelfish: animationFile("fish-swim-angelfish", true),
    clownfish: animationFile("fish-swim-clownfish", true),
    neonTetra: animationFile("fish-swim-neon-tetra", true),
    guppy: animationFile("fish-swim-guppy", true),
    dwarfGourami: animationFile("fish-swim-dwarf-gourami", true),
    discus: animationFile("fish-swim-discus", true),
    emeraldDragonfish: animationFile("fish-swim-emerald-dragonfish", true),
    celestialKoi: animationFile("fish-swim-celestial-koi", true),
    crystalTang: animationFile("fish-swim-crystal-tang", true),
    midnightManta: animationFile("fish-swim-midnight-manta", true)
  }
} as const;

export const fishImageBySpecies: Record<FishSpecies, string> = {
  GUPPY: aquariumAssets.fish.guppy,
  GOLDFISH: aquariumAssets.fish.goldfish,
  BETTA: aquariumAssets.fish.betta,
  NEON_TETRA: aquariumAssets.fish.neonTetra,
  ANGELFISH: aquariumAssets.fish.angelfish,
  DISCUS: aquariumAssets.fish.discus,
  MANDARINFISH: aquariumAssets.fish.crystalTang,
  DRAGON_KOI: aquariumAssets.fish.celestialKoi
};

export const fishAnimationBySpecies: Record<FishSpecies, string> = {
  GUPPY: aquariumAnimations.fishSwim.guppy,
  GOLDFISH: aquariumAnimations.fishSwim.goldfish,
  BETTA: aquariumAnimations.fishSwim.betta,
  NEON_TETRA: aquariumAnimations.fishSwim.neonTetra,
  ANGELFISH: aquariumAnimations.fishSwim.angelfish,
  DISCUS: aquariumAnimations.fishSwim.discus,
  MANDARINFISH: aquariumAnimations.fishSwim.crystalTang,
  DRAGON_KOI: aquariumAnimations.fishSwim.celestialKoi
};
