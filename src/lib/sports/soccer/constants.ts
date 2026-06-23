import type {
  AttributeGroup,
  FormationDef,
  PositionMeta,
  TrainingFocus,
} from "@/lib/types";

// Soccer positions, grouped GK / DEF / MID / FWD.
export const SOCCER_POSITIONS: PositionMeta[] = [
  { key: "GK", label: { ko: "골키퍼", en: "Goalkeeper" }, group: "GK" },
  { key: "CB", label: { ko: "센터백", en: "Centre Back" }, group: "DEF" },
  { key: "LB", label: { ko: "왼쪽 풀백", en: "Left Back" }, group: "DEF" },
  { key: "RB", label: { ko: "오른쪽 풀백", en: "Right Back" }, group: "DEF" },
  { key: "DM", label: { ko: "수비형 미드필더", en: "Defensive Mid" }, group: "MID" },
  { key: "CM", label: { ko: "중앙 미드필더", en: "Central Mid" }, group: "MID" },
  { key: "AM", label: { ko: "공격형 미드필더", en: "Attacking Mid" }, group: "MID" },
  { key: "LW", label: { ko: "왼쪽 윙어", en: "Left Wing" }, group: "FWD" },
  { key: "RW", label: { ko: "오른쪽 윙어", en: "Right Wing" }, group: "FWD" },
  { key: "ST", label: { ko: "스트라이커", en: "Striker" }, group: "FWD" },
];

export const POSITION_GROUP: Record<string, string> = Object.fromEntries(
  SOCCER_POSITIONS.map((p) => [p.key, p.group]),
);

export const SOCCER_ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    key: "technical",
    label: { ko: "기술", en: "Technical" },
    attributes: [
      { key: "finishing", label: { ko: "결정력", en: "Finishing" }, abbr: { ko: "결정", en: "FIN" } },
      { key: "passing", label: { ko: "패스", en: "Passing" }, abbr: { ko: "패스", en: "PAS" } },
      { key: "dribbling", label: { ko: "드리블", en: "Dribbling" }, abbr: { ko: "드리블", en: "DRI" } },
      { key: "crossing", label: { ko: "크로스", en: "Crossing" }, abbr: { ko: "크로스", en: "CRO" } },
      { key: "tackling", label: { ko: "태클", en: "Tackling" }, abbr: { ko: "태클", en: "TAC" } },
      { key: "heading", label: { ko: "헤딩", en: "Heading" }, abbr: { ko: "헤딩", en: "HEA" } },
      { key: "technique", label: { ko: "테크닉", en: "Technique" }, abbr: { ko: "기술", en: "TEC" } },
    ],
  },
  {
    key: "mental",
    label: { ko: "정신", en: "Mental" },
    attributes: [
      { key: "positioning", label: { ko: "위치선정", en: "Positioning" }, abbr: { ko: "위치", en: "POS" } },
      { key: "vision", label: { ko: "시야", en: "Vision" }, abbr: { ko: "시야", en: "VIS" } },
      { key: "composure", label: { ko: "침착성", en: "Composure" }, abbr: { ko: "침착", en: "COM" } },
      { key: "workRate", label: { ko: "활동량", en: "Work Rate" }, abbr: { ko: "활동", en: "WOR" } },
      { key: "decisions", label: { ko: "판단력", en: "Decisions" }, abbr: { ko: "판단", en: "DEC" } },
      { key: "aggression", label: { ko: "적극성", en: "Aggression" }, abbr: { ko: "적극", en: "AGG" } },
    ],
  },
  {
    key: "physical",
    label: { ko: "신체", en: "Physical" },
    attributes: [
      { key: "pace", label: { ko: "스피드", en: "Pace" }, abbr: { ko: "속도", en: "PAC" } },
      { key: "stamina", label: { ko: "체력", en: "Stamina" }, abbr: { ko: "체력", en: "STA" } },
      { key: "strength", label: { ko: "몸싸움", en: "Strength" }, abbr: { ko: "힘", en: "STR" } },
      { key: "agility", label: { ko: "민첩성", en: "Agility" }, abbr: { ko: "민첩", en: "AGI" } },
    ],
  },
  {
    key: "goalkeeping",
    label: { ko: "골키핑", en: "Goalkeeping" },
    onlyForGroup: "GK",
    attributes: [
      { key: "reflexes", label: { ko: "반응속도", en: "Reflexes" }, abbr: { ko: "반응", en: "REF" } },
      { key: "handling", label: { ko: "핸들링", en: "Handling" }, abbr: { ko: "핸들", en: "HAN" } },
      { key: "kicking", label: { ko: "킥", en: "Kicking" }, abbr: { ko: "킥", en: "KIC" } },
      { key: "command", label: { ko: "수비조율", en: "Command" }, abbr: { ko: "조율", en: "CMD" } },
    ],
  },
];

export const SOCCER_ATTRIBUTE_KEYS: string[] = SOCCER_ATTRIBUTE_GROUPS.flatMap((g) =>
  g.attributes.map((a) => a.key),
);

// Position -> weighted attribute importance for the overall rating.
// Weights need not sum to 1; the rating normalises by their total.
export const POSITION_WEIGHTS: Record<string, Record<string, number>> = {
  GK: { reflexes: 0.3, handling: 0.25, command: 0.15, kicking: 0.1, positioning: 0.1, composure: 0.1 },
  CB: { tackling: 0.24, heading: 0.2, strength: 0.15, positioning: 0.15, decisions: 0.1, pace: 0.1, composure: 0.06 },
  LB: { tackling: 0.18, pace: 0.18, stamina: 0.15, crossing: 0.12, positioning: 0.1, technique: 0.1, workRate: 0.1, strength: 0.07 },
  RB: { tackling: 0.18, pace: 0.18, stamina: 0.15, crossing: 0.12, positioning: 0.1, technique: 0.1, workRate: 0.1, strength: 0.07 },
  DM: { tackling: 0.2, positioning: 0.15, passing: 0.15, stamina: 0.12, decisions: 0.12, strength: 0.1, vision: 0.08, workRate: 0.08 },
  CM: { passing: 0.2, vision: 0.15, technique: 0.12, stamina: 0.12, decisions: 0.12, dribbling: 0.1, workRate: 0.1, tackling: 0.09 },
  AM: { passing: 0.18, vision: 0.18, dribbling: 0.15, technique: 0.13, finishing: 0.12, composure: 0.12, pace: 0.12 },
  LW: { dribbling: 0.2, pace: 0.2, crossing: 0.15, finishing: 0.13, technique: 0.12, agility: 0.1, passing: 0.1 },
  RW: { dribbling: 0.2, pace: 0.2, crossing: 0.15, finishing: 0.13, technique: 0.12, agility: 0.1, passing: 0.1 },
  ST: { finishing: 0.28, positioning: 0.18, composure: 0.15, heading: 0.12, pace: 0.12, dribbling: 0.08, strength: 0.07 },
};

// Formation slot layouts (x across, y up the pitch from own goal).
export const SOCCER_FORMATIONS: FormationDef[] = [
  {
    key: "4-3-3",
    slots: [
      { position: "GK", x: 50, y: 6 },
      { position: "LB", x: 16, y: 26 },
      { position: "CB", x: 38, y: 22 },
      { position: "CB", x: 62, y: 22 },
      { position: "RB", x: 84, y: 26 },
      { position: "CM", x: 30, y: 50 },
      { position: "CM", x: 50, y: 46 },
      { position: "CM", x: 70, y: 50 },
      { position: "LW", x: 18, y: 76 },
      { position: "ST", x: 50, y: 82 },
      { position: "RW", x: 82, y: 76 },
    ],
  },
  {
    key: "4-4-2",
    slots: [
      { position: "GK", x: 50, y: 6 },
      { position: "LB", x: 16, y: 26 },
      { position: "CB", x: 38, y: 22 },
      { position: "CB", x: 62, y: 22 },
      { position: "RB", x: 84, y: 26 },
      { position: "LW", x: 16, y: 54 },
      { position: "CM", x: 40, y: 50 },
      { position: "CM", x: 60, y: 50 },
      { position: "RW", x: 84, y: 54 },
      { position: "ST", x: 40, y: 82 },
      { position: "ST", x: 60, y: 82 },
    ],
  },
  {
    key: "4-2-3-1",
    slots: [
      { position: "GK", x: 50, y: 6 },
      { position: "LB", x: 16, y: 26 },
      { position: "CB", x: 38, y: 22 },
      { position: "CB", x: 62, y: 22 },
      { position: "RB", x: 84, y: 26 },
      { position: "DM", x: 40, y: 42 },
      { position: "DM", x: 60, y: 42 },
      { position: "LW", x: 18, y: 66 },
      { position: "AM", x: 50, y: 64 },
      { position: "RW", x: 82, y: 66 },
      { position: "ST", x: 50, y: 84 },
    ],
  },
  {
    key: "3-5-2",
    slots: [
      { position: "GK", x: 50, y: 6 },
      { position: "CB", x: 30, y: 22 },
      { position: "CB", x: 50, y: 20 },
      { position: "CB", x: 70, y: 22 },
      { position: "LB", x: 12, y: 48 },
      { position: "CM", x: 38, y: 50 },
      { position: "DM", x: 50, y: 44 },
      { position: "CM", x: 62, y: 50 },
      { position: "RB", x: 88, y: 48 },
      { position: "ST", x: 40, y: 82 },
      { position: "ST", x: 60, y: 82 },
    ],
  },
];

export const SOCCER_TRAINING_FOCUSES: TrainingFocus[] = [
  { key: "attacking", label: { ko: "공격", en: "Attacking" }, attributes: ["finishing", "dribbling", "composure"] },
  { key: "playmaking", label: { ko: "플레이메이킹", en: "Playmaking" }, attributes: ["passing", "vision", "technique"] },
  { key: "defending", label: { ko: "수비", en: "Defending" }, attributes: ["tackling", "positioning", "heading"] },
  { key: "physical", label: { ko: "피지컬", en: "Physical" }, attributes: ["pace", "stamina", "strength"] },
  { key: "goalkeeping", label: { ko: "골키핑", en: "Goalkeeping" }, attributes: ["reflexes", "handling", "command"] },
  { key: "balanced", label: { ko: "균형", en: "Balanced" }, attributes: SOCCER_ATTRIBUTE_KEYS },
];
