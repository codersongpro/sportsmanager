import type { Club } from "@/lib/types";

/**
 * Baseline weekly income before matchday gate receipts (see `matchFlow.ts`'s
 * `applyMatchdayIncome`) and season-end prize money. Reputation-driven with a
 * small wage-bill kicker; shared by the engine's weekly finance pass and the
 * dashboard's finance summary so the two never drift apart.
 */
export function weeklyIncomeFor(club: Club, wageBill: number): number {
  return Math.round(club.reputation * 1200 + wageBill * 0.1);
}
