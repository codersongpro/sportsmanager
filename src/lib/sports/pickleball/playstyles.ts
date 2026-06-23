import type { PlayStyleDef, PositionKey } from "@/lib/types";

export const PB_PLAYSTYLES: PlayStyleDef[] = [
  // Baseliner
  { key: "power_driver", label: { ko: "파워 드라이버", en: "Power Driver" }, desc: { ko: "강력한 그라운드 스트로크", en: "Hammers groundstrokes" }, positions: ["BL"], boosts: { drive: 8, spin: 3 } },
  { key: "spin_doctor", label: { ko: "스핀 마스터", en: "Spin Doctor" }, desc: { ko: "현란한 회전 구사", en: "Wicked spin on every ball" }, positions: ["BL"], boosts: { spin: 8, serve: 3 } },
  { key: "cannon_serve", label: { ko: "캐넌 서브", en: "Cannon Serve" }, desc: { ko: "강력한 서브", en: "Big-time serve" }, positions: ["BL"], boosts: { serve: 8, drive: 3 } },
  { key: "backcourt_wall", label: { ko: "백코트의 벽", en: "Backcourt Wall" }, desc: { ko: "끈질긴 수비", en: "Returns everything" }, positions: ["BL"], boosts: { consistency: 7, speed: 4 } },
  { key: "third_shot_drop", label: { ko: "서드샷 드롭", en: "Third-Shot Drop" }, desc: { ko: "정교한 드롭샷", en: "Surgical third-shot drops" }, positions: ["BL"], boosts: { dink: 5, strategy: 5 } },
  { key: "tactician_bl", label: { ko: "전략가", en: "Tactician" }, desc: { ko: "영리한 코트 운영", en: "Out-thinks opponents" }, positions: ["BL"], boosts: { strategy: 7, consistency: 4 } },

  // Net Player
  { key: "net_killer", label: { ko: "네트 킬러", en: "Net Killer" }, desc: { ko: "발리로 끝내는 해결사", en: "Puts away volleys" }, positions: ["NP"], boosts: { volley: 8, reflexes: 3 } },
  { key: "dink_master", label: { ko: "딩크 마스터", en: "Dink Master" }, desc: { ko: "부드러운 딩크의 달인", en: "Soft-game wizard" }, positions: ["NP"], boosts: { dink: 8, strategy: 3 } },
  { key: "quick_hands", label: { ko: "퀵 핸즈", en: "Quick Hands" }, desc: { ko: "번개 같은 반응", en: "Lightning-fast hands" }, positions: ["NP"], boosts: { reflexes: 8, agility: 4 } },
  { key: "poacher_pb", label: { ko: "포처", en: "Poacher" }, desc: { ko: "과감한 가로채기", en: "Aggressive at the line" }, positions: ["NP"], boosts: { agility: 6, volley: 5 } },
  { key: "kitchen_king", label: { ko: "키친 킹", en: "Kitchen King" }, desc: { ko: "네트 앞 지배", en: "Owns the non-volley zone" }, positions: ["NP"], boosts: { dink: 6, volley: 4 } },
  { key: "counter_puncher", label: { ko: "카운터 펀처", en: "Counter-Puncher" }, desc: { ko: "역습의 달인", en: "Thrives on the counter" }, positions: ["NP"], boosts: { reflexes: 5, composure: 5 } },
];

const BY_POSITION: Record<string, PlayStyleDef[]> = {};
for (const ps of PB_PLAYSTYLES) for (const pos of ps.positions) (BY_POSITION[pos] ??= []).push(ps);

export function pbPlaystylesFor(position: PositionKey): PlayStyleDef[] {
  return BY_POSITION[position] ?? [];
}
