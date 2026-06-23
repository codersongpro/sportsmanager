import type { Player, PositionKey } from "@/lib/types";
import { POSITION_WEIGHTS } from "./constants";

/** Weighted overall rating for a player at a given (or primary) position. */
export function calcOverall(player: Player, position?: PositionKey): number {
  const pos = position ?? player.positions[0] ?? "CM";
  const weights = POSITION_WEIGHTS[pos] ?? POSITION_WEIGHTS.CM;
  let sum = 0;
  let total = 0;
  for (const key in weights) {
    const w = weights[key];
    sum += (player.attributes[key] ?? 0) * w;
    total += w;
  }
  return Math.round(total > 0 ? sum / total : 0);
}

/** Best overall across all eligible positions. */
export function bestOverall(player: Player): number {
  return Math.max(...player.positions.map((p) => calcOverall(player, p)));
}

/**
 * Market value (in money units) from overall, potential and age.
 * Roughly: 50 OVR ~ 0.2M, 70 ~ 5M, 80 ~ 25M, 90 ~ 130M, premium for youth.
 */
export function playerValue(overall: number, potential: number, age: number): number {
  let v = Math.exp((overall - 40) / 6) * 31400;
  let ageFactor: number;
  if (age <= 20) ageFactor = 1.3;
  else if (age <= 23) ageFactor = 1.2;
  else if (age <= 28) ageFactor = 1.0;
  else if (age <= 31) ageFactor = 0.72;
  else if (age <= 33) ageFactor = 0.48;
  else ageFactor = 0.28;
  v *= ageFactor;
  if (age < 25) v *= 1 + Math.max(0, potential - overall) * 0.03;
  return Math.max(50000, Math.round(v / 50000) * 50000);
}

/** Weekly wage derived from market value. */
export function playerWage(value: number): number {
  return Math.max(500, Math.round((value * 0.0006 + 300) / 100) * 100);
}
