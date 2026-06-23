import { describe, expect, it } from "vitest";
import { createRng, hashSeed } from "./rng";

describe("rng", () => {
  it("is deterministic for a given seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it("can resume from a serialized state", () => {
    const a = createRng(hashSeed("save-1"));
    a.next();
    a.next();
    const state = a.state();
    const expected = a.next();

    const resumed = createRng(state);
    expect(resumed.next()).toBe(expected);
  });

  it("int() stays within the inclusive bounds", () => {
    const rng = createRng(7);
    for (let i = 0; i < 200; i++) {
      const v = rng.int(3, 8);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(8);
    }
  });
});
