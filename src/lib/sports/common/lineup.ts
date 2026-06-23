import type { Club, FormationDef, Player, PositionKey, ValidationResult } from "@/lib/types";
import { makeCalcOverall, type PositionWeights } from "./ratings";

export interface LineupConfig {
  formations: FormationDef[];
  positionWeights: PositionWeights;
  fallbackPos: string;
  positionGroup: Record<string, string>;
  /** position groups that must appear at least once (e.g. soccer GK, baseball P) */
  requiredGroups?: { group: string; min: number; labelKo: string; labelEn: string }[];
  benchSize?: number;
}

/** Build a sport's autoPickLineup + validateLineup from its config. */
export function makeLineup(cfg: LineupConfig) {
  const calcOverall = makeCalcOverall(cfg.positionWeights, cfg.fallbackPos);
  const formationOf = (key: string) => cfg.formations.find((f) => f.key === key) ?? cfg.formations[0];

  function autoPickLineup(club: Club, players: Record<string, Player>): { lineup: string[]; bench: string[] } {
    const form = formationOf(club.tactics.formation);
    const pool = club.squad.map((id) => players[id]).filter((p): p is Player => !!p);
    const used = new Set<string>();
    const lineup: string[] = [];

    for (const slot of form.slots) {
      let best: Player | undefined;
      let bestScore = -1;
      for (const p of pool) {
        if (used.has(p.id)) continue;
        let score = calcOverall(p, slot.position);
        if (p.positions.includes(slot.position)) score += 6;
        else if (cfg.positionGroup[p.positions[0]] === cfg.positionGroup[slot.position]) score += 2;
        if (score > bestScore) {
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
      .slice(0, cfg.benchSize ?? 7)
      .map((p) => p.id);

    return { lineup, bench };
  }

  function validateLineup(club: Club, players: Record<string, Player>): ValidationResult {
    const errors: ValidationResult["errors"] = [];
    const lineup = club.tactics.lineup;
    const need = formationOf(club.tactics.formation).slots.length;
    if (lineup.length !== need) {
      errors.push({ ko: `선발은 ${need}명이어야 합니다 (현재 ${lineup.length}명)`, en: `Starting lineup must be ${need} players (currently ${lineup.length})` });
    }
    for (const req of cfg.requiredGroups ?? []) {
      const count = lineup.filter((id) => cfg.positionGroup[(players[id]?.positions[0] ?? "") as PositionKey] === req.group).length;
      if (count < req.min) errors.push({ ko: `${req.labelKo}이(가) 부족합니다`, en: `Not enough ${req.labelEn}` });
    }
    for (const id of lineup) {
      if (!players[id] || !club.squad.includes(id)) {
        errors.push({ ko: "라인업에 잘못된 선수가 있습니다", en: "Lineup contains an invalid player" });
        break;
      }
    }
    return { valid: errors.length === 0, errors };
  }

  return { autoPickLineup, validateLineup };
}
