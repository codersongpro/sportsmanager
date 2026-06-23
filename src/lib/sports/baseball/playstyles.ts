import type { PlayStyleDef, PositionKey } from "@/lib/types";

export const BSB_PLAYSTYLES: PlayStyleDef[] = [
  // Pitchers
  { key: "flamethrower", label: { ko: "파이어볼러", en: "Flamethrower" }, desc: { ko: "강속구로 압도", en: "Overpowers with velocity" }, positions: ["SP", "RP"], boosts: { velocity: 8, movement: 3 } },
  { key: "control_artist", label: { ko: "제구의 마술사", en: "Control Artist" }, desc: { ko: "칼날 같은 제구력", en: "Pinpoint command" }, positions: ["SP", "RP"], boosts: { control: 8, composure: 4 } },
  { key: "junkballer", label: { ko: "변화구 투수", en: "Junkballer" }, desc: { ko: "현란한 변화구", en: "Nasty movement" }, positions: ["SP", "RP"], boosts: { movement: 8, control: 3 } },
  { key: "workhorse", label: { ko: "이닝 이터", en: "Workhorse" }, desc: { ko: "긴 이닝을 책임짐", en: "Eats innings" }, positions: ["SP"], boosts: { pStamina: 8, composure: 3 } },
  { key: "closer", label: { ko: "클로저", en: "Closer" }, desc: { ko: "마무리에 특화", en: "Lockdown in the ninth" }, positions: ["RP"], boosts: { velocity: 5, composure: 6 } },
  { key: "crafty", label: { ko: "노련한 투수", en: "Crafty Veteran" }, desc: { ko: "노련한 경기 운영", en: "Outsmarts hitters" }, positions: ["SP"], boosts: { baseballIq: 6, control: 4 } },

  // Catcher
  { key: "field_general_c", label: { ko: "안방 사령관", en: "Field General" }, desc: { ko: "투수 리드와 수비 지휘", en: "Calls a great game" }, positions: ["C"], boosts: { baseballIq: 7, fielding: 4 } },
  { key: "cannon_arm", label: { ko: "강견 포수", en: "Cannon Arm" }, desc: { ko: "도루 저지의 명수", en: "Guns down base stealers" }, positions: ["C"], boosts: { arm: 8, fielding: 3 } },
  { key: "slugging_c", label: { ko: "공격형 포수", en: "Slugging Catcher" }, desc: { ko: "한 방을 갖춘 포수", en: "Power behind the plate" }, positions: ["C"], boosts: { power: 6, contact: 4 } },

  // Infield
  { key: "slick_fielder", label: { ko: "수비의 달인", en: "Slick Fielder" }, desc: { ko: "화려한 글러브", en: "Vacuum in the field" }, positions: ["SS", "2B", "3B", "1B"], boosts: { fielding: 7, arm: 4 } },
  { key: "table_setter", label: { ko: "테이블 세터", en: "Table Setter" }, desc: { ko: "출루와 빠른 발", en: "Gets on and runs" }, positions: ["2B", "SS"], boosts: { speed: 6, eye: 5 } },
  { key: "corner_slugger", label: { ko: "코너 거포", en: "Corner Slugger" }, desc: { ko: "코너 인필더 장타", en: "Big power at the corners" }, positions: ["1B", "3B"], boosts: { power: 8, contact: 3 } },
  { key: "wizard_ss", label: { ko: "유격수 마법사", en: "Defensive Wizard" }, desc: { ko: "범위 넓은 수비", en: "Incredible range" }, positions: ["SS"], boosts: { fielding: 6, speed: 5 } },

  // Outfield
  { key: "five_tool", label: { ko: "5툴 플레이어", en: "Five-Tool Player" }, desc: { ko: "모든 것을 갖춤", en: "Does it all" }, positions: ["CF", "RF", "LF"], boosts: { contact: 4, power: 4, speed: 4, arm: 3 } },
  { key: "speed_demon", label: { ko: "대도", en: "Speed Demon" }, desc: { ko: "발야구의 핵심", en: "Terror on the bases" }, positions: ["CF", "LF"], boosts: { speed: 8, contact: 3 } },
  { key: "slugger_of", label: { ko: "거포 외야수", en: "Power Hitter" }, desc: { ko: "담장을 넘기는 힘", en: "Launches bombs" }, positions: ["RF", "LF"], boosts: { power: 8, eye: 3 } },
  { key: "gold_glove_of", label: { ko: "골드글러브", en: "Gold Glove" }, desc: { ko: "철벽 외야 수비", en: "Elite outfield defense" }, positions: ["CF", "RF"], boosts: { fielding: 6, arm: 5 } },

  // Hitting (all batters)
  { key: "contact_hitter", label: { ko: "교타자", en: "Contact Hitter" }, desc: { ko: "정교한 타격", en: "Sprays line drives" }, positions: ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"], boosts: { contact: 7, eye: 3 } },
  { key: "patient_eye", label: { ko: "선구안", en: "Patient Eye" }, desc: { ko: "볼넷을 골라내는 눈", en: "Works the count" }, positions: ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"], boosts: { eye: 8, contact: 2 } },
  { key: "slugger_dh", label: { ko: "홈런 타자", en: "Home Run Hitter" }, desc: { ko: "압도적 파워", en: "Elite raw power" }, positions: ["DH", "1B"], boosts: { power: 9 } },
  { key: "clutch_hitter", label: { ko: "해결사", en: "Clutch Hitter" }, desc: { ko: "찬스에 강함", en: "Comes through in the clutch" }, positions: ["DH", "3B", "RF", "LF"], boosts: { composure: 7, contact: 3 } },
];

const BY_POSITION: Record<string, PlayStyleDef[]> = {};
for (const ps of BSB_PLAYSTYLES) for (const pos of ps.positions) (BY_POSITION[pos] ??= []).push(ps);

export function bsbPlaystylesFor(position: PositionKey): PlayStyleDef[] {
  return BY_POSITION[position] ?? [];
}
