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

/**
 * A bell-shaped "on the day" performance multiplier centred on 1.0, used to give
 * a single segment (half/quarter/inning/set) controlled swing so the favourite
 * doesn't win in a flat, foregone way. Default spread keeps it within ±~18%, so
 * ratings still dominate over a full season while any one match stays alive.
 * Must be drawn from the seeded `rng` to preserve determinism across the atomic
 * and segment-by-segment simulation paths.
 */
export function performanceMultiplier(rng: RNG, spread = 0.09): number {
  return Math.max(1 - 2 * spread, Math.min(1 + 2 * spread, rng.gaussian(1, spread)));
}

/**
 * Per-player development multiplier folding match fitness (condition), recent
 * form and morale into effective ability. Makes the training / rotation /
 * man-management loop visibly pay off: a rested, in-form, high-morale player is
 * meaningfully sharper than a tired, out-of-form, unhappy one (~1.45x swing at
 * the extremes), while two equally-managed squads still separate on raw ability.
 * Deterministic (no rng), so simulation determinism is unaffected.
 */
export function developmentFactor(player: Player): number {
  const condition = 0.8 + (player.condition / 100) * 0.2; // 0.80 (spent) .. 1.0 (fresh)
  const form = 1 + player.form * 0.018; // form is -5..+5  ->  ±9%
  const morale = 1 + ((player.morale - 50) / 50) * 0.05; // 0..100  ->  ±5%
  return condition * form * morale;
}

/**
 * Lineup-average development multiplier (condition/form/morale), for sports that
 * model team strength as an attribute aggregate rather than per-player. Multiply
 * a side's offence AND defence by this so a tired/low-morale team both scores
 * less and concedes more; a fresh, in-form, happy team is sharper at both ends.
 */
export function lineupDevelopment(lineup: Player[]): number {
  if (!lineup.length) return 1;
  return lineup.reduce((s, p) => s + developmentFactor(p), 0) / lineup.length;
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
