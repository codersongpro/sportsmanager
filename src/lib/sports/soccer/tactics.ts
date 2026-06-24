// Single source of truth for tactic-dial effects, shared by the match
// simulation (sim.ts) and the tactics UI (tacticTags). Keeping the math in
// one place means the UI description can never drift from the actual sim.

import type { LocalizedText, Tactics } from "@/lib/types";

export function mentalityAttackMult(mentality: Tactics["mentality"]): number {
  return mentality === "attacking" ? 1.12 : mentality === "defensive" ? 0.9 : 1;
}

export function mentalityDefenseMult(mentality: Tactics["mentality"]): number {
  return mentality === "attacking" ? 0.92 : mentality === "defensive" ? 1.12 : 1;
}

/** Faster tempo creates more attacking events (shots). */
export function tempoAttackMult(tempo: Tactics["tempo"]): number {
  return tempo === "fast" ? 1.12 : tempo === "slow" ? 0.9 : 1;
}

/** Higher pressing intensity draws more fouls from the pressing team. */
export function pressingFoulMult(pressing: Tactics["pressing"]): number {
  return pressing === "high" ? 1.45 : pressing === "low" ? 0.75 : 1;
}

/** A high-pressing opponent disrupts your build-up, lowering your xG. */
export function pressingDisruptionMult(pressing: Tactics["pressing"]): number {
  return pressing === "high" ? 0.94 : pressing === "low" ? 1.03 : 1;
}

/** Wider play generates more corners / crossing situations. */
export function widthCrossMult(width: Tactics["width"]): number {
  return width === "wide" ? 1.5 : width === "narrow" ? 0.55 : 1;
}

/** Narrower play favours central, through-the-middle event flavor. */
export function widthThroughMult(width: Tactics["width"]): number {
  return width === "narrow" ? 1.3 : width === "wide" ? 0.85 : 1;
}

const CROSS_FLAVOR_TYPES = new Set(["cross", "overlap", "switchPlay"]);
const THROUGH_FLAVOR_TYPES = new Set(["throughBall", "lineBreak", "wallPass", "backHeel"]);

export function isCrossFlavor(type: string): boolean {
  return CROSS_FLAVOR_TYPES.has(type);
}

export function isThroughFlavor(type: string): boolean {
  return THROUGH_FLAVOR_TYPES.has(type);
}

/** Exactly 4 short bilingual tags (one per tactic dial), derived from the same multipliers used by the sim. */
export function tacticTags(tactics: Tactics): LocalizedText[] {
  const tags: LocalizedText[] = [];

  tags.push(
    tactics.mentality === "attacking"
      ? { ko: "공격적 전개", en: "Attacking intent" }
      : tactics.mentality === "defensive"
        ? { ko: "수비 안정 우선", en: "Defensively solid" }
        : { ko: "균형 잡힌 멘탈리티", en: "Balanced mentality" },
  );

  tags.push(
    tactics.tempo === "fast"
      ? { ko: "빠른 템포, 슈팅 증가", en: "Fast tempo, more shots" }
      : tactics.tempo === "slow"
        ? { ko: "느린 템포, 점유 위주", en: "Slow tempo, possession-based" }
        : { ko: "표준 템포", en: "Standard tempo" },
  );

  tags.push(
    tactics.pressing === "high"
      ? { ko: "높은 압박, 파울 증가", en: "High press, more fouls" }
      : tactics.pressing === "low"
        ? { ko: "낮은 압박, 체력 절약", en: "Low press, conserves energy" }
        : { ko: "중간 강도 압박", en: "Moderate pressing" },
  );

  tags.push(
    tactics.width === "wide"
      ? { ko: "측면 활용, 크로스 증가", en: "Wide play, more crosses" }
      : tactics.width === "narrow"
        ? { ko: "중앙 집중, 스루패스 위주", en: "Narrow play, through-the-middle" }
        : { ko: "표준 폭 운영", en: "Standard width" },
  );

  return tags;
}
