import type { Club, Player, ValidationResult } from "@/lib/types";
import { POSITION_GROUP, SOCCER_FORMATIONS } from "./constants";
import { calcOverall } from "./ratings";

function formation(key: string) {
  return SOCCER_FORMATIONS.find((f) => f.key === key) ?? SOCCER_FORMATIONS[0];
}

/** Greedy best-XI for the club's current formation. */
export function autoPickLineup(
  club: Club,
  players: Record<string, Player>,
): { lineup: string[]; bench: string[] } {
  const form = formation(club.tactics.formation);
  const pool = club.squad
    .map((id) => players[id])
    .filter((p): p is Player => !!p);

  const used = new Set<string>();
  const lineup: string[] = [];

  for (const slot of form.slots) {
    let best: Player | undefined;
    let bestRank = -1;
    let bestScore = -1;
    for (const p of pool) {
      if (used.has(p.id)) continue;
      // Prefer a true positional fit first (exact position, then same group), so a
      // required slot like GK is always filled by a real keeper when one is
      // available; rating only breaks ties within the same fit tier.
      const rank = p.positions.includes(slot.position) ? 2 : POSITION_GROUP[p.positions[0]] === POSITION_GROUP[slot.position] ? 1 : 0;
      const score = calcOverall(p, slot.position);
      if (rank > bestRank || (rank === bestRank && score > bestScore)) {
        bestRank = rank;
        bestScore = score;
        best = p;
      }
    }
    if (best) {
      used.add(best.id);
      lineup.push(best.id);
    }
  }

  const bench = pool
    .filter((p) => !used.has(p.id))
    .sort((a, b) => Math.max(...b.positions.map((x) => calcOverall(b, x))) - Math.max(...a.positions.map((x) => calcOverall(a, x))))
    .slice(0, 9)
    .map((p) => p.id);

  return { lineup, bench };
}

export function validateLineup(
  club: Club,
  players: Record<string, Player>,
): ValidationResult {
  const errors: ValidationResult["errors"] = [];
  const lineup = club.tactics.lineup;

  if (lineup.length !== 11) {
    errors.push({ ko: `선발은 11명이어야 합니다 (현재 ${lineup.length}명)`, en: `Starting XI must be 11 players (currently ${lineup.length})` });
  }
  const gkCount = lineup.filter((id) => POSITION_GROUP[players[id]?.positions[0] ?? ""] === "GK").length;
  if (gkCount < 1) {
    errors.push({ ko: "골키퍼가 없습니다", en: "No goalkeeper selected" });
  }
  for (const id of lineup) {
    if (!players[id] || !club.squad.includes(id)) {
      errors.push({ ko: "라인업에 잘못된 선수가 있습니다", en: "Lineup contains an invalid player" });
      break;
    }
  }
  return { valid: errors.length === 0, errors };
}
