import type { AttributeGroup, FormationDef, PositionMeta, SquadSlot, TrainingFocus } from "@/lib/types";
import type { PositionWeights } from "../common/ratings";

export const BSB_POSITIONS: PositionMeta[] = [
  { key: "SP", label: { ko: "선발 투수", en: "Starting Pitcher" }, group: "P" },
  { key: "RP", label: { ko: "구원 투수", en: "Relief Pitcher" }, group: "P" },
  { key: "C", label: { ko: "포수", en: "Catcher" }, group: "C" },
  { key: "1B", label: { ko: "1루수", en: "First Base" }, group: "IF" },
  { key: "2B", label: { ko: "2루수", en: "Second Base" }, group: "IF" },
  { key: "3B", label: { ko: "3루수", en: "Third Base" }, group: "IF" },
  { key: "SS", label: { ko: "유격수", en: "Shortstop" }, group: "IF" },
  { key: "LF", label: { ko: "좌익수", en: "Left Field" }, group: "OF" },
  { key: "CF", label: { ko: "중견수", en: "Center Field" }, group: "OF" },
  { key: "RF", label: { ko: "우익수", en: "Right Field" }, group: "OF" },
  { key: "DH", label: { ko: "지명타자", en: "Designated Hitter" }, group: "DH" },
];

export const BSB_POSITION_GROUP: Record<string, string> = Object.fromEntries(BSB_POSITIONS.map((p) => [p.key, p.group]));

export const BSB_ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    key: "batting",
    label: { ko: "타격", en: "Batting" },
    attributes: [
      { key: "contact", label: { ko: "콘택트", en: "Contact" }, abbr: { ko: "정확", en: "CON" } },
      { key: "power", label: { ko: "파워", en: "Power" }, abbr: { ko: "파워", en: "POW" } },
      { key: "eye", label: { ko: "선구안", en: "Plate Discipline" }, abbr: { ko: "선구", en: "EYE" } },
      { key: "speed", label: { ko: "주루", en: "Base Running" }, abbr: { ko: "주루", en: "SPD" } },
    ],
  },
  {
    key: "fielding",
    label: { ko: "수비", en: "Fielding" },
    attributes: [
      { key: "fielding", label: { ko: "수비", en: "Fielding" }, abbr: { ko: "수비", en: "FLD" } },
      { key: "arm", label: { ko: "송구", en: "Arm" }, abbr: { ko: "송구", en: "ARM" } },
    ],
  },
  {
    key: "pitching",
    label: { ko: "투구", en: "Pitching" },
    onlyForGroup: "P",
    attributes: [
      { key: "velocity", label: { ko: "구속", en: "Velocity" }, abbr: { ko: "구속", en: "VEL" } },
      { key: "control", label: { ko: "제구", en: "Control" }, abbr: { ko: "제구", en: "CTL" } },
      { key: "movement", label: { ko: "무브먼트", en: "Movement" }, abbr: { ko: "무브", en: "MOV" } },
      { key: "pStamina", label: { ko: "투구 체력", en: "Stamina" }, abbr: { ko: "체력", en: "STM" } },
    ],
  },
  {
    key: "mental",
    label: { ko: "정신", en: "Mental" },
    attributes: [
      { key: "composure", label: { ko: "침착성", en: "Composure" }, abbr: { ko: "침착", en: "CMP" } },
      { key: "baseballIq", label: { ko: "야구 센스", en: "Baseball IQ" }, abbr: { ko: "센스", en: "IQ" } },
    ],
  },
];

export const BSB_ATTRIBUTE_KEYS: string[] = BSB_ATTRIBUTE_GROUPS.flatMap((g) => g.attributes.map((a) => a.key));

export const BSB_POSITION_WEIGHTS: PositionWeights = {
  SP: { velocity: 0.24, control: 0.24, movement: 0.22, pStamina: 0.18, composure: 0.12 },
  RP: { velocity: 0.28, control: 0.22, movement: 0.24, pStamina: 0.1, composure: 0.16 },
  C: { fielding: 0.26, arm: 0.22, contact: 0.18, baseballIq: 0.18, power: 0.16 },
  "1B": { power: 0.3, contact: 0.28, fielding: 0.22, eye: 0.2 },
  "2B": { fielding: 0.28, speed: 0.2, contact: 0.22, arm: 0.16, eye: 0.14 },
  "3B": { fielding: 0.24, arm: 0.2, power: 0.26, contact: 0.2, eye: 0.1 },
  SS: { fielding: 0.3, arm: 0.22, speed: 0.18, contact: 0.18, baseballIq: 0.12 },
  LF: { power: 0.28, contact: 0.24, arm: 0.16, speed: 0.16, fielding: 0.16 },
  CF: { speed: 0.26, fielding: 0.24, contact: 0.22, arm: 0.16, power: 0.12 },
  RF: { power: 0.26, arm: 0.22, contact: 0.22, fielding: 0.16, speed: 0.14 },
  DH: { power: 0.34, contact: 0.32, eye: 0.24, baseballIq: 0.1 },
};

// Starting nine on a diamond (y: home plate at bottom → outfield at top).
export const BSB_FORMATIONS: FormationDef[] = [
  {
    key: "선발 9인",
    slots: [
      { position: "SP", x: 50, y: 42 },
      { position: "C", x: 50, y: 12 },
      { position: "1B", x: 70, y: 44 },
      { position: "2B", x: 60, y: 56 },
      { position: "SS", x: 40, y: 56 },
      { position: "3B", x: 30, y: 44 },
      { position: "LF", x: 24, y: 82 },
      { position: "CF", x: 50, y: 90 },
      { position: "RF", x: 76, y: 82 },
    ],
  },
];

export const BSB_SQUAD_TEMPLATE: SquadSlot[] = [
  { pos: "SP", count: 4 },
  { pos: "RP", count: 4 },
  { pos: "C", count: 2 },
  { pos: "1B", count: 2 },
  { pos: "2B", count: 2 },
  { pos: "3B", count: 2 },
  { pos: "SS", count: 2 },
  { pos: "LF", count: 2 },
  { pos: "CF", count: 2 },
  { pos: "RF", count: 2 },
  { pos: "DH", count: 2 },
];

export const BSB_TRAINING_FOCUSES: TrainingFocus[] = [
  { key: "contact", label: { ko: "정확도", en: "Contact" }, attributes: ["contact", "eye"] },
  { key: "power", label: { ko: "장타", en: "Power" }, attributes: ["power", "contact"] },
  { key: "pitching", label: { ko: "투구", en: "Pitching" }, attributes: ["velocity", "control", "movement"] },
  { key: "fielding", label: { ko: "수비", en: "Fielding" }, attributes: ["fielding", "arm"] },
  { key: "speed", label: { ko: "주루", en: "Speed" }, attributes: ["speed"] },
  { key: "balanced", label: { ko: "균형", en: "Balanced" }, attributes: BSB_ATTRIBUTE_KEYS },
];

export const BSB_PHYSICAL_ATTRS = ["speed", "velocity", "pStamina"];

export const BSB_PITCHER_ATTRS = ["velocity", "control", "movement", "pStamina"];
export const BSB_BATTER_ATTRS = ["contact", "power", "eye", "speed", "fielding", "arm"];
