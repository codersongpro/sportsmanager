import type { AttributeGroup, FormationDef, PositionMeta, SquadSlot, TrainingFocus } from "@/lib/types";
import type { PositionWeights } from "../common/ratings";

export const PB_POSITIONS: PositionMeta[] = [
  { key: "BL", label: { ko: "베이스라이너", en: "Baseliner" }, group: "BACK" },
  { key: "NP", label: { ko: "네트 플레이어", en: "Net Player" }, group: "NET" },
];

export const PB_POSITION_GROUP: Record<string, string> = Object.fromEntries(PB_POSITIONS.map((p) => [p.key, p.group]));

export const PB_ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    key: "skill",
    label: { ko: "기술", en: "Skill" },
    attributes: [
      { key: "dink", label: { ko: "딩크", en: "Dink" }, abbr: { ko: "딩크", en: "DNK" } },
      { key: "drive", label: { ko: "드라이브", en: "Drive" }, abbr: { ko: "드라이브", en: "DRV" } },
      { key: "volley", label: { ko: "발리", en: "Volley" }, abbr: { ko: "발리", en: "VOL" } },
      { key: "serve", label: { ko: "서브", en: "Serve" }, abbr: { ko: "서브", en: "SRV" } },
      { key: "spin", label: { ko: "스핀", en: "Spin" }, abbr: { ko: "스핀", en: "SPN" } },
    ],
  },
  {
    key: "movement",
    label: { ko: "움직임", en: "Movement" },
    attributes: [
      { key: "speed", label: { ko: "스피드", en: "Speed" }, abbr: { ko: "속도", en: "SPD" } },
      { key: "reflexes", label: { ko: "반응속도", en: "Reflexes" }, abbr: { ko: "반응", en: "REF" } },
      { key: "agility", label: { ko: "민첩성", en: "Agility" }, abbr: { ko: "민첩", en: "AGI" } },
    ],
  },
  {
    key: "mental",
    label: { ko: "정신", en: "Mental" },
    attributes: [
      { key: "strategy", label: { ko: "전략", en: "Strategy" }, abbr: { ko: "전략", en: "STR" } },
      { key: "composure", label: { ko: "침착성", en: "Composure" }, abbr: { ko: "침착", en: "CMP" } },
      { key: "consistency", label: { ko: "일관성", en: "Consistency" }, abbr: { ko: "일관", en: "CON" } },
    ],
  },
];

export const PB_ATTRIBUTE_KEYS: string[] = PB_ATTRIBUTE_GROUPS.flatMap((g) => g.attributes.map((a) => a.key));

export const PB_POSITION_WEIGHTS: PositionWeights = {
  BL: { drive: 0.24, serve: 0.18, spin: 0.16, speed: 0.16, consistency: 0.16, strategy: 0.1 },
  NP: { volley: 0.26, dink: 0.24, reflexes: 0.2, agility: 0.16, strategy: 0.14 },
};

// A doubles pair on one half of the court (net at top).
export const PB_FORMATIONS: FormationDef[] = [
  {
    key: "복식",
    slots: [
      { position: "NP", x: 35, y: 58 },
      { position: "BL", x: 68, y: 24 },
    ],
  },
];

export const PB_SQUAD_TEMPLATE: SquadSlot[] = [
  { pos: "BL", count: 4 },
  { pos: "NP", count: 4 },
];

export const PB_TRAINING_FOCUSES: TrainingFocus[] = [
  { key: "power", label: { ko: "파워", en: "Power" }, attributes: ["drive", "serve", "spin"] },
  { key: "touch", label: { ko: "터치", en: "Touch" }, attributes: ["dink", "volley"] },
  { key: "movement", label: { ko: "풋워크", en: "Footwork" }, attributes: ["speed", "agility", "reflexes"] },
  { key: "strategy", label: { ko: "전략", en: "Strategy" }, attributes: ["strategy", "consistency"] },
  { key: "serve", label: { ko: "서브", en: "Serve" }, attributes: ["serve", "spin"] },
  { key: "balanced", label: { ko: "균형", en: "Balanced" }, attributes: PB_ATTRIBUTE_KEYS },
];

export const PB_PHYSICAL_ATTRS = ["speed", "agility", "reflexes"];
