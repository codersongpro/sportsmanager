import type { LocalizedText, Player } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";

export function poisson(rng: RNG, lambda: number): number {
  const L = Math.exp(-Math.max(0, lambda));
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng.next();
  } while (p > L);
  return k - 1;
}

export interface Pool {
  players: Player[];
  weights: number[];
}

/** Weighted pick of a lineup player; weight from an attribute-based scorer. */
export function buildPool(lineup: Player[], weight: (p: Player) => number): Pool {
  return { players: lineup, weights: lineup.map((p) => Math.max(0.01, weight(p))) };
}

export function pick(rng: RNG, pool: Pool, exclude?: Player): Player | undefined {
  if (!pool.players.length) return undefined;
  if (!exclude) return rng.weighted(pool.players, pool.weights);
  const players: Player[] = [];
  const weights: number[] = [];
  for (let i = 0; i < pool.players.length; i++) {
    if (pool.players[i].id !== exclude.id) {
      players.push(pool.players[i]);
      weights.push(pool.weights[i]);
    }
  }
  return players.length ? rng.weighted(players, weights) : undefined;
}

export function phrase(rng: RNG, pool: LocalizedText[]): LocalizedText {
  return pool[rng.int(0, pool.length - 1)];
}

/** Simple lineup-average of an attribute (0 if empty). */
export function avgAttr(lineup: Player[], key: string): number {
  if (!lineup.length) return 45;
  return lineup.reduce((s, p) => s + (p.attributes[key] ?? 40), 0) / lineup.length;
}
