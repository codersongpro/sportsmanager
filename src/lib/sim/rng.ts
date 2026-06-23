// Deterministic seeded RNG (mulberry32). Keeping an explicit, serializable
// state lets us reproduce simulations and resume a save with identical results.

export interface RNG {
  /** float in [0, 1) */
  next(): number;
  /** integer in [min, max] inclusive */
  int(min: number, max: number): number;
  /** float in [min, max) */
  range(min: number, max: number): number;
  /** true with probability p (default 0.5) */
  bool(p?: number): boolean;
  /** uniform pick from a non-empty array */
  pick<T>(arr: readonly T[]): T;
  /** weighted pick; weights align with items, must sum > 0 */
  weighted<T>(items: readonly T[], weights: readonly number[]): T;
  /** approx normal via sum of uniforms, clamped is caller's job */
  gaussian(mean: number, sd: number): number;
  /** Fisher–Yates shuffle returning a new array */
  shuffle<T>(arr: readonly T[]): T[];
  /** current internal state, for persistence */
  state(): number;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return {
    next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    state() {
      return a >>> 0;
    },
  };
}

export function createRng(seed: number): RNG {
  const core = mulberry32(seed);

  const rng: RNG = {
    next: () => core.next(),
    int: (min, max) => Math.floor(core.next() * (max - min + 1)) + min,
    range: (min, max) => core.next() * (max - min) + min,
    bool: (p = 0.5) => core.next() < p,
    pick: (arr) => arr[Math.floor(core.next() * arr.length)],
    weighted: (items, weights) => {
      const total = weights.reduce((s, w) => s + w, 0);
      let r = core.next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) return items[i];
      }
      return items[items.length - 1];
    },
    gaussian: (mean, sd) => {
      // sum of 4 uniforms ~ approx normal (Bates), good enough for ratings
      let sum = 0;
      for (let i = 0; i < 4; i++) sum += core.next();
      return mean + ((sum - 2) / Math.sqrt(4 / 12)) * sd;
    },
    shuffle: (arr) => {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(core.next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    state: () => core.state(),
  };
  return rng;
}

/** Stable string -> 32-bit seed hash. */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
