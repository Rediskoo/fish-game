import { describe, expect, it } from "vitest";
import { addFriendSchema, breedingActionSchema, inviteBreedingSchema } from "./game";

describe("social validation", () => {
  it.each(["123456789", "aquarium_friend", "@aquarium_friend"])("accepts friend lookup %s", (query) => {
    expect(addFriendSchema.parse({ query })).toEqual({ query });
  });

  it.each(["12", "bad-name!", "@"])("rejects invalid friend lookup %s", (query) => {
    expect(() => addFriendSchema.parse({ query })).toThrow();
  });

  it("requires a fish when accepting a parent invitation", () => {
    expect(() => breedingActionSchema.parse({ invitationId: "cm12345678901234567890123", action: "accept-parent-invite" })).toThrow();
  });

  it("validates an invitation made with one parent", () => {
    const input = { mode: "invite" as const, parentFishId: "cm12345678901234567890123", friendId: "cm22345678901234567890123", idempotencyKey: "123e4567-e89b-42d3-a456-426614174000" };
    expect(inviteBreedingSchema.parse(input)).toEqual(input);
  });
});
