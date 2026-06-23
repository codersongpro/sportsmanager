import type { AttributeGroup, FormationDef, PositionMeta, SquadSlot, TrainingFocus } from "@/lib/types";
import type { PositionWeights } from "../common/ratings";

export const BB_POSITIONS: PositionMeta[] = [
  { key: "PG", label: { ko: "포인트 가드", en: "Point Guard" }, group: "GUARD" },
  { key: "SG", label: { ko: "슈팅 가드", en: "Shooting Guard" }, group: "GUARD" },
  { key: "SF", label: { ko: "스몰 포워드", en: "Small Forward" }, group: "WING" },
  { key: "PF", label: { ko: "파워 포워드", en: "Power Forward" }, group: "BIG" },
  { key: "C", label: { ko: "센터", en: "Center" }, group: "BIG" },
];

export const BB_POSITION_GROUP: Record<string, string> = Object.fromEntries(BB_POSITIONS.map((p) => [p.key, p.group]));

export const BB_ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    key: "offense",
    label: { ko: "공격", en: "Offense" },
    attributes: [
      { key: "shooting", label: { ko: "중거리 슛", en: "Mid-Range" }, abbr: { ko: "중거리", en: "MID" } },
      { key: "three", label: { ko: "3점 슛", en: "Three-Point" }, abbr: { ko: "3점", en: "3PT" } },
      { key: "finishing", label: { ko: "골밑 마무리", en: "Finishing" }, abbr: { ko: "골밑", en: "FIN" } },
      { key: "freeThrow", label: { ko: "자유투", en: "Free Throw" }, abbr: { ko: "자유투", en: "FT" } },
      { key: "passing", label: { ko: "패스", en: "Passing" }, abbr: { ko: "패스", en: "PAS" } },
      { key: "handle", label: { ko: "볼 핸들링", en: "Ball Handling" }, abbr: { ko: "핸들", en: "HND" } },
    ],
  },
  {
    key: "defense",
    label: { ko: "수비", en: "Defense" },
    attributes: [
      { key: "perimeter", label: { ko: "외곽 수비", en: "Perimeter D" }, abbr: { ko: "외곽", en: "PRM" } },
      { key: "interior", label: { ko: "골밑 수비", en: "Interior D" }, abbr: { ko: "골밑수", en: "INT" } },
      { key: "steal", label: { ko: "스틸", en: "Steal" }, abbr: { ko: "스틸", en: "STL" } },
      { key: "block", label: { ko: "블록", en: "Block" }, abbr: { ko: "블록", en: "BLK" } },
      { key: "rebound", label: { ko: "리바운드", en: "Rebound" }, abbr: { ko: "리바", en: "REB" } },
    ],
  },
  {
    key: "physical",
    label: { ko: "신체", en: "Physical" },
    attributes: [
      { key: "speed", label: { ko: "스피드", en: "Speed" }, abbr: { ko: "속도", en: "SPD" } },
      { key: "strength", label: { ko: "파워", en: "Strength" }, abbr: { ko: "힘", en: "STR" } },
      { key: "jumping", label: { ko: "점프력", en: "Jumping" }, abbr: { ko: "점프", en: "JMP" } },
      { key: "stamina", label: { ko: "체력", en: "Stamina" }, abbr: { ko: "체력", en: "STA" } },
    ],
  },
  {
    key: "mental",
    label: { ko: "정신", en: "Mental" },
    attributes: [
      { key: "iq", label: { ko: "농구 센스", en: "Basketball IQ" }, abbr: { ko: "센스", en: "IQ" } },
      { key: "composure", label: { ko: "침착성", en: "Composure" }, abbr: { ko: "침착", en: "CMP" } },
      { key: "hustle", label: { ko: "허슬", en: "Hustle" }, abbr: { ko: "허슬", en: "HUS" } },
    ],
  },
];

export const BB_ATTRIBUTE_KEYS: string[] = BB_ATTRIBUTE_GROUPS.flatMap((g) => g.attributes.map((a) => a.key));

export const BB_POSITION_WEIGHTS: PositionWeights = {
  PG: { passing: 0.2, handle: 0.18, three: 0.15, shooting: 0.12, steal: 0.1, speed: 0.1, iq: 0.15 },
  SG: { three: 0.22, shooting: 0.18, finishing: 0.12, handle: 0.12, perimeter: 0.12, speed: 0.12, composure: 0.12 },
  SF: { finishing: 0.18, three: 0.16, perimeter: 0.14, rebound: 0.12, strength: 0.12, speed: 0.14, iq: 0.14 },
  PF: { finishing: 0.2, rebound: 0.2, interior: 0.16, block: 0.12, strength: 0.16, jumping: 0.16 },
  C: { finishing: 0.2, rebound: 0.22, interior: 0.2, block: 0.16, strength: 0.16, jumping: 0.06 },
};

// One starting-five "formation"; slots placed on a half-court layout.
export const BB_FORMATIONS: FormationDef[] = [
  {
    key: "스타팅 5",
    slots: [
      { position: "PG", x: 50, y: 28 },
      { position: "SG", x: 20, y: 44 },
      { position: "SF", x: 80, y: 46 },
      { position: "PF", x: 34, y: 68 },
      { position: "C", x: 66, y: 72 },
    ],
  },
];

export const BB_SQUAD_TEMPLATE: SquadSlot[] = [
  { pos: "PG", count: 2 },
  { pos: "SG", count: 3 },
  { pos: "SF", count: 3 },
  { pos: "PF", count: 2 },
  { pos: "C", count: 2 },
];

export const BB_TRAINING_FOCUSES: TrainingFocus[] = [
  { key: "shooting", label: { ko: "슈팅", en: "Shooting" }, attributes: ["three", "shooting", "freeThrow"] },
  { key: "playmaking", label: { ko: "플레이메이킹", en: "Playmaking" }, attributes: ["passing", "handle", "iq"] },
  { key: "defense", label: { ko: "수비", en: "Defense" }, attributes: ["perimeter", "interior", "steal", "block"] },
  { key: "athleticism", label: { ko: "운동능력", en: "Athleticism" }, attributes: ["speed", "jumping", "stamina"] },
  { key: "rebounding", label: { ko: "리바운드", en: "Rebounding" }, attributes: ["rebound", "strength", "jumping"] },
  { key: "balanced", label: { ko: "균형", en: "Balanced" }, attributes: BB_ATTRIBUTE_KEYS },
];

export const BB_PHYSICAL_ATTRS = ["speed", "jumping", "stamina"];
