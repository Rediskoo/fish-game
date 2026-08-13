import { describe, expect, it } from "vitest";
import { addFriendSchema, breedingActionSchema } from "./game";

describe("social validation", () => {
  it.each(["123456789", "aquarium_friend", "@aquarium_friend"])("accepts friend lookup %s", (query) => {
    expect(addFriendSchema.parse({ query })).toEqual({ query });
  });

  it.each(["12", "bad-name!", "@"])("rejects invalid friend lookup %s", (query) => {
    expect(() => addFriendSchema.parse({ query })).toThrow();
  });

  it("requires a friend for a breeding invitation", () => {
    expect(() => breedingActionSchema.parse({ jobId: "cm12345678901234567890123", action: "invite" })).toThrow();
  });

  it("accepts a collaboration invitation without a friend id", () => {
    expect(breedingActionSchema.parse({ jobId: "cm12345678901234567890123", action: "accept" }).action).toBe("accept");
  });
});
