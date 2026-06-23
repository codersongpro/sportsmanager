import type { AttributeGroup, FormationDef, PositionMeta, SquadSlot, TrainingFocus } from "@/lib/types";
import type { PositionWeights } from "../common/ratings";

export const VB_POSITIONS: PositionMeta[] = [
  { key: "S", label: { ko: "세터", en: "Setter" }, group: "SET" },
  { key: "OH", label: { ko: "아웃사이드 히터", en: "Outside Hitter" }, group: "ATT" },
  { key: "MB", label: { ko: "미들 블로커", en: "Middle Blocker" }, group: "BLK" },
  { key: "OPP", label: { ko: "아포짓 스파이커", en: "Opposite" }, group: "ATT" },
  { key: "L", label: { ko: "리베로", en: "Libero" }, group: "LIB" },
];

export const VB_POSITION_GROUP: Record<string, string> = Object.fromEntries(VB_POSITIONS.map((p) => [p.key, p.group]));

export const VB_ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    key: "attack",
    label: { ko: "공격", en: "Attack" },
    attributes: [
      { key: "spike", label: { ko: "스파이크", en: "Spike" }, abbr: { ko: "스파이크", en: "SPK" } },
      { key: "serve", label: { ko: "서브", en: "Serve" }, abbr: { ko: "서브", en: "SRV" } },
      { key: "setting", label: { ko: "토스", en: "Setting" }, abbr: { ko: "토스", en: "SET" } },
    ],
  },
  {
    key: "defense",
    label: { ko: "수비", en: "Defense" },
    attributes: [
      { key: "block", label: { ko: "블로킹", en: "Block" }, abbr: { ko: "블록", en: "BLK" } },
      { key: "dig", label: { ko: "디그", en: "Dig" }, abbr: { ko: "디그", en: "DIG" } },
      { key: "receive", label: { ko: "리시브", en: "Receive" }, abbr: { ko: "리시브", en: "RCV" } },
    ],
  },
  {
    key: "physical",
    label: { ko: "신체", en: "Physical" },
    attributes: [
      { key: "jump", label: { ko: "점프", en: "Jump" }, abbr: { ko: "점프", en: "JMP" } },
      { key: "speed", label: { ko: "스피드", en: "Speed" }, abbr: { ko: "속도", en: "SPD" } },
      { key: "power", label: { ko: "파워", en: "Power" }, abbr: { ko: "파워", en: "POW" } },
    ],
  },
  {
    key: "mental",
    label: { ko: "정신", en: "Mental" },
    attributes: [
      { key: "composure", label: { ko: "침착성", en: "Composure" }, abbr: { ko: "침착", en: "CMP" } },
      { key: "courtIq", label: { ko: "코트 센스", en: "Court IQ" }, abbr: { ko: "센스", en: "IQ" } },
    ],
  },
];

export const VB_ATTRIBUTE_KEYS: string[] = VB_ATTRIBUTE_GROUPS.flatMap((g) => g.attributes.map((a) => a.key));

export const VB_POSITION_WEIGHTS: PositionWeights = {
  S: { setting: 0.34, courtIq: 0.2, speed: 0.16, dig: 0.16, composure: 0.14 },
  OH: { spike: 0.28, receive: 0.2, serve: 0.16, jump: 0.18, power: 0.18 },
  MB: { block: 0.3, spike: 0.22, jump: 0.24, speed: 0.14, power: 0.1 },
  OPP: { spike: 0.3, serve: 0.18, block: 0.18, power: 0.22, jump: 0.12 },
  L: { dig: 0.34, receive: 0.3, speed: 0.18, composure: 0.18 },
};

// Starting six on one half-court; net is along the top (high y).
export const VB_FORMATIONS: FormationDef[] = [
  {
    key: "스타팅 6",
    slots: [
      { position: "OH", x: 20, y: 62 },
      { position: "MB", x: 50, y: 68 },
      { position: "OPP", x: 80, y: 62 },
      { position: "OH", x: 24, y: 28 },
      { position: "MB", x: 50, y: 24 },
      { position: "S", x: 76, y: 32 },
    ],
  },
];

export const VB_SQUAD_TEMPLATE: SquadSlot[] = [
  { pos: "S", count: 2 },
  { pos: "OH", count: 4 },
  { pos: "MB", count: 3 },
  { pos: "OPP", count: 2 },
  { pos: "L", count: 2 },
];

export const VB_TRAINING_FOCUSES: TrainingFocus[] = [
  { key: "attack", label: { ko: "공격", en: "Attack" }, attributes: ["spike", "power", "jump"] },
  { key: "serve", label: { ko: "서브", en: "Serve" }, attributes: ["serve", "power"] },
  { key: "block", label: { ko: "블로킹", en: "Block" }, attributes: ["block", "jump"] },
  { key: "defense", label: { ko: "수비", en: "Defense" }, attributes: ["dig", "receive", "speed"] },
  { key: "setting", label: { ko: "세팅", en: "Setting" }, attributes: ["setting", "courtIq"] },
  { key: "balanced", label: { ko: "균형", en: "Balanced" }, attributes: VB_ATTRIBUTE_KEYS },
];

export const VB_PHYSICAL_ATTRS = ["jump", "speed", "power"];
