import type { PlayStyleDef, PositionKey } from "@/lib/types";

// Each position has a pool of 6 play styles. A generated player gets 1-3 of
// them from their primary position's pool. Styles add flavour and a small
// attribute emphasis, and are surfaced on the player profile.

export const SOCCER_PLAYSTYLES: PlayStyleDef[] = [
  // --- Goalkeeper (GK) ---
  { key: "sweeper_keeper", label: { ko: "스위퍼 키퍼", en: "Sweeper Keeper" }, desc: { ko: "수비 뒷공간을 커버하고 빌드업에 가담", en: "Covers space behind the line and joins build-up" }, positions: ["GK"], boosts: { pace: 5, kicking: 5, command: 4 } },
  { key: "shot_stopper", label: { ko: "샷 스토퍼", en: "Shot Stopper" }, desc: { ko: "1대1 선방에 특화", en: "Excels at one-on-one saves" }, positions: ["GK"], boosts: { reflexes: 6, handling: 4 } },
  { key: "penalty_saver", label: { ko: "PK 스페셜리스트", en: "Penalty Specialist" }, desc: { ko: "승부차기에 강함", en: "Strong in penalty shootouts" }, positions: ["GK"], boosts: { reflexes: 4, composure: 5, positioning: 3 } },
  { key: "long_distributor", label: { ko: "롱 디스트리뷰터", en: "Long Distributor" }, desc: { ko: "정확한 롱킥으로 역습 시작", en: "Launches counters with long kicks" }, positions: ["GK"], boosts: { kicking: 7, vision: 4 } },
  { key: "commander", label: { ko: "수비 사령관", en: "Commanding Presence" }, desc: { ko: "수비 라인을 지휘", en: "Organises the back line" }, positions: ["GK"], boosts: { command: 7, decisions: 4 } },
  { key: "reflex_cat", label: { ko: "고양이 반사", en: "Reflex Cat" }, desc: { ko: "폭발적인 반응 속도", en: "Explosive reactions" }, positions: ["GK"], boosts: { reflexes: 5, agility: 5 } },

  // --- Centre Back (CB) ---
  { key: "ball_playing_def", label: { ko: "볼 플레잉 디펜더", en: "Ball-Playing Defender" }, desc: { ko: "후방에서 정확한 빌드업", en: "Builds play from the back" }, positions: ["CB"], boosts: { passing: 6, technique: 5, composure: 4 } },
  { key: "no_nonsense", label: { ko: "터프 스토퍼", en: "No-Nonsense Stopper" }, desc: { ko: "거친 몸싸움과 클리어링", en: "Wins duels and clears danger" }, positions: ["CB"], boosts: { tackling: 5, strength: 6, heading: 4 } },
  { key: "aerial_dominator", label: { ko: "공중 지배자", en: "Aerial Dominator" }, desc: { ko: "제공권 장악", en: "Dominates in the air" }, positions: ["CB"], boosts: { heading: 7, strength: 5 } },
  { key: "aggressive_marker", label: { ko: "압박 마커", en: "Aggressive Marker" }, desc: { ko: "전진 압박으로 차단", en: "Steps out to press and intercept" }, positions: ["CB"], boosts: { aggression: 6, tackling: 4, positioning: 4 } },
  { key: "pace_defender", label: { ko: "스피드 디펜더", en: "Pace Defender" }, desc: { ko: "빠른 발로 뒷공간 커버", en: "Recovers with raw pace" }, positions: ["CB"], boosts: { pace: 7, agility: 4 } },
  { key: "libero", label: { ko: "리베로", en: "Libero" }, desc: { ko: "전진해 공격에 가담", en: "Steps into midfield to create" }, positions: ["CB"], boosts: { passing: 5, dribbling: 4, vision: 5 } },

  // --- Full Backs (LB / RB) ---
  { key: "wing_back", label: { ko: "오버래핑 윙백", en: "Overlapping Wing-Back" }, desc: { ko: "끊임없는 측면 오버래핑", en: "Relentless overlapping runs" }, positions: ["LB", "RB"], boosts: { stamina: 6, pace: 5, crossing: 4 } },
  { key: "defensive_fb", label: { ko: "수비형 풀백", en: "Defensive Fullback" }, desc: { ko: "안정적인 수비 우선", en: "Defends first, stays disciplined" }, positions: ["LB", "RB"], boosts: { tackling: 6, positioning: 5 } },
  { key: "inverted_fb", label: { ko: "인버티드 풀백", en: "Inverted Fullback" }, desc: { ko: "중앙으로 좁혀 빌드업", en: "Tucks inside to build play" }, positions: ["LB", "RB"], boosts: { passing: 6, vision: 4, technique: 4 } },
  { key: "crossing_specialist", label: { ko: "크로스 머신", en: "Crossing Specialist" }, desc: { ko: "날카로운 크로스 공급", en: "Whips in dangerous crosses" }, positions: ["LB", "RB"], boosts: { crossing: 8, technique: 4 } },
  { key: "marauder", label: { ko: "마라우딩 런너", en: "Marauding Runner" }, desc: { ko: "공격적인 전진 침투", en: "Bombs forward at every chance" }, positions: ["LB", "RB"], boosts: { pace: 6, dribbling: 5, stamina: 4 } },
  { key: "complete_fb", label: { ko: "컴플리트 풀백", en: "Complete Fullback" }, desc: { ko: "공수 양면에서 완성형", en: "Excellent at both ends" }, positions: ["LB", "RB"], boosts: { tackling: 4, crossing: 4, stamina: 4, pace: 3 } },

  // --- Defensive Mid (DM) ---
  { key: "ball_winner", label: { ko: "볼 위너", en: "Ball-Winner" }, desc: { ko: "끊임없이 볼을 탈취", en: "Hunts and wins the ball back" }, positions: ["DM"], boosts: { tackling: 6, aggression: 5, stamina: 4 } },
  { key: "deep_playmaker", label: { ko: "딥 라잉 플레이메이커", en: "Deep-Lying Playmaker" }, desc: { ko: "후방에서 경기를 조율", en: "Dictates play from deep" }, positions: ["DM"], boosts: { passing: 7, vision: 6, composure: 4 } },
  { key: "anchor", label: { ko: "앵커맨", en: "Anchor Man" }, desc: { ko: "수비 라인 앞 보호막", en: "Shields the back line" }, positions: ["DM"], boosts: { positioning: 6, tackling: 5, decisions: 4 } },
  { key: "regista", label: { ko: "레지스타", en: "Regista" }, desc: { ko: "전방위 패스 마스터", en: "Free-roaming deep creator" }, positions: ["DM"], boosts: { passing: 6, vision: 7, technique: 5 } },
  { key: "destroyer", label: { ko: "디스트로이어", en: "Destroyer" }, desc: { ko: "상대 공격을 분쇄", en: "Breaks up everything" }, positions: ["DM"], boosts: { tackling: 7, strength: 5, aggression: 5 } },
  { key: "dm_engine", label: { ko: "박스 투 박스 엔진", en: "Box-to-Box Engine" }, desc: { ko: "엄청난 활동량", en: "Covers every blade of grass" }, positions: ["DM"], boosts: { stamina: 7, workRate: 6 } },

  // --- Central Mid (CM) ---
  { key: "box_to_box", label: { ko: "박스 투 박스", en: "Box-to-Box" }, desc: { ko: "공수 모두 가담", en: "Contributes at both ends" }, positions: ["CM"], boosts: { stamina: 6, workRate: 5, finishing: 3 } },
  { key: "tempo_setter", label: { ko: "템포 컨트롤러", en: "Tempo Setter" }, desc: { ko: "경기의 리듬을 조율", en: "Controls the game's rhythm" }, positions: ["CM"], boosts: { passing: 6, composure: 5, decisions: 4 } },
  { key: "mezzala", label: { ko: "메짤라", en: "Mezzala" }, desc: { ko: "하프 스페이스 침투", en: "Drives into the half-spaces" }, positions: ["CM"], boosts: { dribbling: 5, finishing: 4, vision: 4 } },
  { key: "cm_ball_winner", label: { ko: "볼 위닝 미드필더", en: "Ball-Winning Mid" }, desc: { ko: "중원에서 압박과 탈취", en: "Presses and recovers in midfield" }, positions: ["CM"], boosts: { tackling: 5, aggression: 5, stamina: 4 } },
  { key: "roaming_pm", label: { ko: "로밍 플레이메이커", en: "Roaming Playmaker" }, desc: { ko: "자유롭게 움직이며 창조", en: "Roams to create chances" }, positions: ["CM"], boosts: { vision: 6, passing: 5, technique: 5 } },
  { key: "cm_engine", label: { ko: "엔진룸", en: "Engine Room" }, desc: { ko: "지칠 줄 모르는 활동량", en: "Tireless midfield runner" }, positions: ["CM"], boosts: { stamina: 7, workRate: 6 } },

  // --- Attacking Mid (AM) ---
  { key: "classic_ten", label: { ko: "클래식 10번", en: "Classic No.10" }, desc: { ko: "전형적인 공격형 미드필더", en: "Classic playmaking 10" }, positions: ["AM"], boosts: { passing: 6, vision: 6, technique: 5 } },
  { key: "shadow_striker", label: { ko: "섀도우 스트라이커", en: "Shadow Striker" }, desc: { ko: "2선에서 침투 득점", en: "Arrives late to score" }, positions: ["AM"], boosts: { finishing: 6, positioning: 5, pace: 4 } },
  { key: "trequartista", label: { ko: "트레콰르티스타", en: "Trequartista" }, desc: { ko: "수비 부담 없는 창조자", en: "Free creative roamer" }, positions: ["AM"], boosts: { technique: 6, dribbling: 5, vision: 5 } },
  { key: "through_ball", label: { ko: "스루패스 마에스트로", en: "Through-Ball Maestro" }, desc: { ko: "결정적 침투 패스", en: "Slides killer through balls" }, positions: ["AM"], boosts: { vision: 7, passing: 6 } },
  { key: "set_piece", label: { ko: "세트피스 전문가", en: "Set-Piece Specialist" }, desc: { ko: "프리킥과 코너킥의 달인", en: "Deadly from dead balls" }, positions: ["AM"], boosts: { technique: 6, finishing: 4, composure: 4 } },
  { key: "dribble_creator", label: { ko: "드리블 크리에이터", en: "Dribbling Creator" }, desc: { ko: "드리블로 공간 창출", en: "Creates with the dribble" }, positions: ["AM"], boosts: { dribbling: 7, agility: 5 } },

  // --- Wingers (LW / RW) ---
  { key: "inverted_winger", label: { ko: "인버티드 윙어", en: "Inverted Winger" }, desc: { ko: "중앙으로 좁혀 슛", en: "Cuts inside to shoot" }, positions: ["LW", "RW"], boosts: { finishing: 6, dribbling: 5, technique: 4 } },
  { key: "touchline_winger", label: { ko: "터치라인 윙어", en: "Touchline Winger" }, desc: { ko: "측면을 허물고 크로스", en: "Hugs the line and crosses" }, positions: ["LW", "RW"], boosts: { crossing: 6, pace: 5, stamina: 4 } },
  { key: "speed_merchant", label: { ko: "스피드 머천트", en: "Speed Merchant" }, desc: { ko: "폭발적인 스피드", en: "Blistering acceleration" }, positions: ["LW", "RW"], boosts: { pace: 8, agility: 5 } },
  { key: "cut_inside", label: { ko: "컷 인사이드 피니셔", en: "Cut-Inside Finisher" }, desc: { ko: "안쪽으로 파고들어 마무리", en: "Drifts in to finish" }, positions: ["LW", "RW"], boosts: { finishing: 7, dribbling: 4 } },
  { key: "playmaking_winger", label: { ko: "플레이메이킹 윙어", en: "Playmaking Winger" }, desc: { ko: "측면에서 기회 창출", en: "Creates from wide areas" }, positions: ["LW", "RW"], boosts: { passing: 6, vision: 5, crossing: 4 } },
  { key: "dribble_king", label: { ko: "드리블 킹", en: "Dribble King" }, desc: { ko: "1대1 돌파의 달인", en: "Unstoppable one-on-one" }, positions: ["LW", "RW"], boosts: { dribbling: 8, agility: 5, technique: 4 } },

  // --- Striker (ST) ---
  { key: "poacher", label: { ko: "포처", en: "Poacher" }, desc: { ko: "골문 앞 해결사", en: "Lives in the box" }, positions: ["ST"], boosts: { finishing: 7, positioning: 6 } },
  { key: "target_man", label: { ko: "타깃맨", en: "Target Man" }, desc: { ko: "최전방 거점, 연계 플레이", en: "Holds the ball up, wins headers" }, positions: ["ST"], boosts: { strength: 7, heading: 6 } },
  { key: "complete_forward", label: { ko: "컴플리트 포워드", en: "Complete Forward" }, desc: { ko: "모든 것을 갖춘 공격수", en: "Does everything up top" }, positions: ["ST"], boosts: { finishing: 4, dribbling: 4, passing: 4, strength: 3 } },
  { key: "false_nine", label: { ko: "폴스 나인", en: "False Nine" }, desc: { ko: "내려와 연계하며 공간 창출", en: "Drops deep to link and create" }, positions: ["ST"], boosts: { passing: 6, vision: 5, technique: 5 } },
  { key: "pressing_forward", label: { ko: "프레싱 포워드", en: "Pressing Forward" }, desc: { ko: "최전방에서 강한 압박", en: "Presses from the front" }, positions: ["ST"], boosts: { workRate: 6, stamina: 5, aggression: 4 } },
  { key: "clinical_finisher", label: { ko: "클리니컬 피니셔", en: "Clinical Finisher" }, desc: { ko: "냉정한 마무리", en: "Ice-cold in front of goal" }, positions: ["ST"], boosts: { finishing: 8, composure: 5 } },
];

const BY_POSITION: Record<string, PlayStyleDef[]> = {};
for (const ps of SOCCER_PLAYSTYLES) {
  for (const pos of ps.positions) {
    (BY_POSITION[pos] ??= []).push(ps);
  }
}

export function playstylesForPosition(position: PositionKey): PlayStyleDef[] {
  return BY_POSITION[position] ?? [];
}

export const PLAYSTYLE_BY_KEY: Record<string, PlayStyleDef> = Object.fromEntries(
  SOCCER_PLAYSTYLES.map((p) => [p.key, p]),
);
