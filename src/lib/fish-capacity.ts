import type { FishView } from "@/types/game";

export const aquariumFishCapacity = 20;

export function splitFishByCapacity(fish: FishView[], capacity = aquariumFishCapacity) {
  return {
    aquariumFish: fish.slice(0, capacity),
    storedFish: fish.slice(capacity)
  };
}
