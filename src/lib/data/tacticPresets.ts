import type { LocalizedText, Tactics } from "@/lib/types";

/** Quick tactic presets offered on the tactics page and the in-match Match Center. */
export interface TacticPreset {
  name: LocalizedText;
  patch: Partial<Tactics>;
}

export const TACTIC_PRESETS: TacticPreset[] = [
  {
    name: { ko: "점유 안정", en: "Possession" },
    patch: { mentality: "balanced", tempo: "slow", pressing: "medium", width: "narrow" },
  },
  {
    name: { ko: "강한 압박", en: "High Press" },
    patch: { mentality: "attacking", tempo: "fast", pressing: "high", width: "normal" },
  },
  {
    name: { ko: "측면 공략", en: "Wing Play" },
    patch: { mentality: "attacking", tempo: "normal", pressing: "medium", width: "wide" },
  },
  {
    name: { ko: "역습 대기", en: "Counter Attack" },
    patch: { mentality: "defensive", tempo: "fast", pressing: "low", width: "wide" },
  },
  {
    name: { ko: "잠그기", en: "Park the Bus" },
    patch: { mentality: "defensive", tempo: "slow", pressing: "low", width: "narrow" },
  },
  {
    name: { ko: "균형 운영", en: "Balanced" },
    patch: { mentality: "balanced", tempo: "normal", pressing: "medium", width: "normal" },
  },
];
