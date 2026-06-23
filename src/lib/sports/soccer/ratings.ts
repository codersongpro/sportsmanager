import type { Player } from "@/lib/types";
import { POSITION_WEIGHTS } from "./constants";
import { makeCalcOverall, playerValue, playerWage } from "../common/ratings";

export { playerValue, playerWage };

/** Weighted overall rating for a player at a given (or primary) position. */
export const calcOverall = makeCalcOverall(POSITION_WEIGHTS, "CM");

/** Best overall across all eligible positions. */
export function bestOverall(player: Player): number {
  return Math.max(...player.positions.map((p) => calcOverall(player, p)));
}
