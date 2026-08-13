import type { BreedingParentSnapshot } from "./types";
import { isHybridSupported } from "./breeding-genetics";

export type ParentEligibility = BreedingParentSnapshot & {
  ownerId: string;
  lifeStage: string;
  breedingLocked: boolean;
  isGiftLocked: boolean;
  hunger: number;
  maxHunger: number;
};

export function validateBreedingParents(parentA: ParentEligibility, parentB: ParentEligibility, ownerId: string) {
  if (parentA.fishId === parentB.fishId) throw new Error("Выберите двух разных рыб");
  if (parentA.ownerId !== ownerId || parentB.ownerId !== ownerId) throw new Error("Обе рыбы должны принадлежать игроку");
  if (parentA.lifeStage !== "ADULT" || parentB.lifeStage !== "ADULT") throw new Error("Родителями могут быть только взрослые рыбы");
  if (parentA.breedingLocked || parentB.breedingLocked) throw new Error("Одна из рыб уже участвует в скрещивании");
  if (parentA.isGiftLocked || parentB.isGiftLocked) throw new Error("Рыба в продаже или передаче недоступна");
  if (!isHybridSupported(parentA.species, parentB.species)) throw new Error("Для этой пары пока нет готового визуального варианта");
}
