import type { PlayStyleDef, PositionKey } from "@/lib/types";

export const VB_PLAYSTYLES: PlayStyleDef[] = [
  // Setter
  { key: "maestro_setter", label: { ko: "마에스트로 세터", en: "Maestro Setter" }, desc: { ko: "완벽한 토스 배분", en: "Flawless set distribution" }, positions: ["S"], boosts: { setting: 8, courtIq: 4 } },
  { key: "tempo_setter_vb", label: { ko: "속공 세터", en: "Quick-Tempo Setter" }, desc: { ko: "빠른 속공 운영", en: "Runs a lightning offense" }, positions: ["S"], boosts: { speed: 6, setting: 5 } },
  { key: "dump_specialist", label: { ko: "기습 공격형", en: "Dump Specialist" }, desc: { ko: "기습 공격으로 득점", en: "Sneaky second-ball attacks" }, positions: ["S"], boosts: { spike: 5, courtIq: 5 } },
  { key: "defensive_setter", label: { ko: "수비형 세터", en: "Defensive Setter" }, desc: { ko: "안정적인 디그", en: "Reliable in the back court" }, positions: ["S"], boosts: { dig: 6, composure: 4 } },

  // Outside Hitter
  { key: "ace_oh", label: { ko: "에이스 스파이커", en: "Ace Spiker" }, desc: { ko: "강력한 스파이크 에이스", en: "Terminating attacker" }, positions: ["OH"], boosts: { spike: 8, power: 4 } },
  { key: "all_round_oh", label: { ko: "올라운드 히터", en: "All-Round Hitter" }, desc: { ko: "공수 겸비", en: "Hits and passes" }, positions: ["OH"], boosts: { spike: 5, receive: 5 } },
  { key: "jump_server", label: { ko: "점프 서버", en: "Jump Server" }, desc: { ko: "강력한 점프 서브", en: "Booming jump serve" }, positions: ["OH", "OPP"], boosts: { serve: 8, jump: 4 } },
  { key: "pipe_attacker", label: { ko: "후위 공격수", en: "Pipe Attacker" }, desc: { ko: "후위에서도 강타", en: "Threat from the back row" }, positions: ["OH"], boosts: { spike: 5, jump: 5 } },
  { key: "passer_oh", label: { ko: "리시브 마스터", en: "Passing Specialist" }, desc: { ko: "안정적인 리시브", en: "Anchors serve receive" }, positions: ["OH"], boosts: { receive: 7, dig: 4 } },

  // Middle Blocker
  { key: "iron_wall", label: { ko: "철벽 블로커", en: "Iron Wall" }, desc: { ko: "압도적인 블로킹", en: "A wall at the net" }, positions: ["MB"], boosts: { block: 8, jump: 4 } },
  { key: "quick_mb", label: { ko: "속공 미들", en: "Quick Attacker" }, desc: { ko: "빠른 속공", en: "Devastating quick sets" }, positions: ["MB"], boosts: { spike: 6, speed: 5 } },
  { key: "read_blocker", label: { ko: "리드 블로커", en: "Read Blocker" }, desc: { ko: "상대 공격을 읽음", en: "Reads the attack" }, positions: ["MB"], boosts: { block: 6, courtIq: 5 } },
  { key: "leaper", label: { ko: "탄력의 미들", en: "Explosive Leaper" }, desc: { ko: "엄청난 점프력", en: "Sky-high vertical" }, positions: ["MB"], boosts: { jump: 8, block: 3 } },

  // Opposite
  { key: "super_ace", label: { ko: "슈퍼 에이스", en: "Super Ace" }, desc: { ko: "팀의 해결사", en: "The go-to terminator" }, positions: ["OPP"], boosts: { spike: 7, power: 5 } },
  { key: "power_server", label: { ko: "파워 서버", en: "Power Server" }, desc: { ko: "서브로 흔들기", en: "Serves to break you down" }, positions: ["OPP"], boosts: { serve: 7, power: 4 } },
  { key: "right_wing_block", label: { ko: "우측 블로커", en: "Right-Side Blocker" }, desc: { ko: "상대 에이스 봉쇄", en: "Blocks the opposing ace" }, positions: ["OPP"], boosts: { block: 7, jump: 4 } },
  { key: "clutch_opp", label: { ko: "클러치 스파이커", en: "Clutch Spiker" }, desc: { ko: "승부처에 강함", en: "Comes up big late" }, positions: ["OPP"], boosts: { composure: 6, spike: 4 } },

  // Libero
  { key: "defense_master", label: { ko: "수비의 달인", en: "Defensive Master" }, desc: { ko: "코트를 지키는 수문장", en: "Digs everything up" }, positions: ["L"], boosts: { dig: 8, speed: 4 } },
  { key: "perfect_passer", label: { ko: "퍼펙트 패서", en: "Perfect Passer" }, desc: { ko: "완벽한 리시브", en: "Flawless serve receive" }, positions: ["L"], boosts: { receive: 8, composure: 4 } },
  { key: "libero_engine", label: { ko: "수비 엔진", en: "Back-Court Engine" }, desc: { ko: "코트를 휘젓는 활동량", en: "Covers the whole floor" }, positions: ["L"], boosts: { speed: 7, dig: 4 } },
  { key: "calm_libero", label: { ko: "침착한 리베로", en: "Composed Libero" }, desc: { ko: "위기에 흔들리지 않음", en: "Unshakeable under pressure" }, positions: ["L"], boosts: { composure: 7, receive: 4 } },
];

const BY_POSITION: Record<string, PlayStyleDef[]> = {};
for (const ps of VB_PLAYSTYLES) for (const pos of ps.positions) (BY_POSITION[pos] ??= []).push(ps);

export function vbPlaystylesFor(position: PositionKey): PlayStyleDef[] {
  return BY_POSITION[position] ?? [];
}
