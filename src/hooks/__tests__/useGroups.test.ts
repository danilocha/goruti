import { describe, it, expect } from "vitest";
import { makeInviteCode } from "../useGroups";

describe("makeInviteCode", () => {
  it("returns a string of exactly 8 characters", () => {
    const code = makeInviteCode();
    expect(typeof code).toBe("string");
    expect(code).toHaveLength(8);
  });

  it("uses only base36 characters (0-9, a-z)", () => {
    const code = makeInviteCode();
    expect(code).toMatch(/^[0-9a-z]{8}$/);
  });

  it("returns different codes on successive calls (probabilistic)", () => {
    const codes = new Set(Array.from({ length: 20 }, () => makeInviteCode()));
    // With 36^8 ≈ 2.8 trillion possibilities, collisions in 20 tries are astronomically unlikely.
    expect(codes.size).toBeGreaterThan(1);
  });
});
