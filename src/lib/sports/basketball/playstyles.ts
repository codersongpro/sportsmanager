import type { PlayStyleDef, PositionKey } from "@/lib/types";

export const BB_PLAYSTYLES: PlayStyleDef[] = [
  // Point Guard
  { key: "floor_general", label: { ko: "플로어 제너럴", en: "Floor General" }, desc: { ko: "경기를 읽고 조율하는 사령탑", en: "Reads and orchestrates the offense" }, positions: ["PG"], boosts: { passing: 6, iq: 6 } },
  { key: "lightning_pg", label: { ko: "스피드스터", en: "Speedster" }, desc: { ko: "전광석화 같은 속공", en: "Blistering open-court speed" }, positions: ["PG"], boosts: { speed: 7, handle: 5 } },
  { key: "sharpshooter_pg", label: { ko: "콤보 가드", en: "Combo Guard" }, desc: { ko: "득점과 운영을 겸비", en: "Scores and creates" }, positions: ["PG"], boosts: { three: 6, shooting: 4 } },
  { key: "pickpocket", label: { ko: "피크포켓", en: "Pickpocket" }, desc: { ko: "끈질긴 압박 수비", en: "Hounds the ball for steals" }, positions: ["PG"], boosts: { steal: 7, perimeter: 4 } },
  { key: "pnr_maestro", label: { ko: "픽앤롤 마에스트로", en: "Pick & Roll Maestro" }, desc: { ko: "픽앤롤의 달인", en: "Surgical out of the pick and roll" }, positions: ["PG"], boosts: { passing: 5, iq: 5, handle: 4 } },
  { key: "clutch_pg", label: { ko: "클러치 핸들러", en: "Clutch Handler" }, desc: { ko: "승부처에 강함", en: "Ice in the veins late" }, positions: ["PG"], boosts: { composure: 7, shooting: 4 } },

  // Shooting Guard
  { key: "sharpshooter", label: { ko: "샤프슈터", en: "Sharpshooter" }, desc: { ko: "외곽 폭격기", en: "Lethal from deep" }, positions: ["SG"], boosts: { three: 8, composure: 4 } },
  { key: "microwave", label: { ko: "마이크로웨이브", en: "Microwave Scorer" }, desc: { ko: "순식간에 득점 폭발", en: "Heats up in a hurry" }, positions: ["SG"], boosts: { shooting: 6, three: 4 } },
  { key: "two_way_g", label: { ko: "3&D 윙", en: "3-and-D Wing" }, desc: { ko: "수비와 외곽슛 겸비", en: "Defends and spaces the floor" }, positions: ["SG", "SF"], boosts: { perimeter: 6, three: 5 } },
  { key: "slasher", label: { ko: "슬래셔", en: "Slasher" }, desc: { ko: "돌파 후 마무리", en: "Attacks the rim relentlessly" }, positions: ["SG", "SF"], boosts: { finishing: 6, speed: 5 } },
  { key: "iso_scorer", label: { ko: "아이솔레이션", en: "Isolation Scorer" }, desc: { ko: "1대1 득점", en: "Bucket in isolation" }, positions: ["SG"], boosts: { handle: 5, shooting: 5 } },
  { key: "energizer", label: { ko: "에너자이저", en: "Energizer" }, desc: { ko: "지칠 줄 모르는 활동량", en: "Tireless two-way motor" }, positions: ["SG"], boosts: { stamina: 6, hustle: 6 } },

  // Small Forward
  { key: "point_forward", label: { ko: "포인트 포워드", en: "Point Forward" }, desc: { ko: "포워드 크기의 플레이메이커", en: "Playmaking from the wing" }, positions: ["SF"], boosts: { passing: 6, iq: 5 } },
  { key: "two_way_wing", label: { ko: "양면 윙", en: "Two-Way Wing" }, desc: { ko: "공수 균형", en: "Impacts both ends" }, positions: ["SF"], boosts: { perimeter: 5, finishing: 4, three: 4 } },
  { key: "athletic_finisher", label: { ko: "운동능력 피니셔", en: "Athletic Finisher" }, desc: { ko: "폭발적인 덩크", en: "Explosive above the rim" }, positions: ["SF", "PF"], boosts: { jumping: 6, finishing: 5 } },
  { key: "lockdown", label: { ko: "락다운 디펜더", en: "Lockdown Defender" }, desc: { ko: "상대 에이스 봉쇄", en: "Shuts down the opposing ace" }, positions: ["SF"], boosts: { perimeter: 7, steal: 4 } },
  { key: "stretch_sf", label: { ko: "스트레치 포워드", en: "Stretch Forward" }, desc: { ko: "공간을 넓히는 슈터", en: "Spaces the floor as a forward" }, positions: ["SF"], boosts: { three: 6, shooting: 4 } },
  { key: "glue_guy", label: { ko: "글루 가이", en: "Glue Guy" }, desc: { ko: "팀을 하나로 묶는 허슬", en: "Does the little things" }, positions: ["SF"], boosts: { hustle: 6, rebound: 4, iq: 4 } },

  // Power Forward
  { key: "stretch_four", label: { ko: "스트레치 4", en: "Stretch Four" }, desc: { ko: "외곽으로 빠지는 빅맨", en: "A big who shoots threes" }, positions: ["PF"], boosts: { three: 7, shooting: 4 } },
  { key: "energy_big", label: { ko: "에너지 빅맨", en: "Energy Big" }, desc: { ko: "허슬과 리바운드", en: "Hustle and second chances" }, positions: ["PF"], boosts: { rebound: 6, hustle: 5 } },
  { key: "post_scorer", label: { ko: "포스트 스코어러", en: "Post Scorer" }, desc: { ko: "포스트업 득점", en: "Scores with his back to the basket" }, positions: ["PF", "C"], boosts: { finishing: 6, strength: 5 } },
  { key: "rim_protector_pf", label: { ko: "림 프로텍터", en: "Rim Protector" }, desc: { ko: "골밑 수비의 핵심", en: "Anchors the paint" }, positions: ["PF", "C"], boosts: { block: 6, interior: 5 } },
  { key: "point_big", label: { ko: "패스 빅맨", en: "Playmaking Big" }, desc: { ko: "하이포스트 연계", en: "Hub of the offense up high" }, positions: ["PF"], boosts: { passing: 6, iq: 5 } },
  { key: "bruiser", label: { ko: "브루저", en: "Bruiser" }, desc: { ko: "거친 몸싸움", en: "Punishes with physicality" }, positions: ["PF"], boosts: { strength: 7, rebound: 4 } },

  // Center
  { key: "rim_protector", label: { ko: "골밑 수문장", en: "Defensive Anchor" }, desc: { ko: "블록과 골밑 장악", en: "Erases shots at the rim" }, positions: ["C"], boosts: { block: 8, interior: 5 } },
  { key: "lob_threat", label: { ko: "롭 위협", en: "Lob Threat" }, desc: { ko: "앨리웁 마무리", en: "Vertical lob finisher" }, positions: ["C"], boosts: { jumping: 7, finishing: 5 } },
  { key: "double_double", label: { ko: "더블더블 머신", en: "Double-Double Machine" }, desc: { ko: "득점과 리바운드", en: "Points and boards nightly" }, positions: ["C"], boosts: { rebound: 7, finishing: 4 } },
  { key: "skilled_big", label: { ko: "스킬 빅맨", en: "Skilled Big" }, desc: { ko: "다재다능한 센터", en: "A modern, skilled center" }, positions: ["C"], boosts: { passing: 5, shooting: 5, iq: 4 } },
  { key: "anchor_wall", label: { ko: "수비의 벽", en: "The Wall" }, desc: { ko: "골밑을 지배", en: "Owns the paint" }, positions: ["C"], boosts: { strength: 6, interior: 6 } },
  { key: "iron_man", label: { ko: "아이언맨", en: "Iron Man" }, desc: { ko: "지칠 줄 모르는 체력", en: "Never leaves the floor" }, positions: ["C"], boosts: { stamina: 7, rebound: 4 } },
];

const BY_POSITION: Record<string, PlayStyleDef[]> = {};
for (const ps of BB_PLAYSTYLES) for (const pos of ps.positions) (BY_POSITION[pos] ??= []).push(ps);

export function bbPlaystylesFor(position: PositionKey): PlayStyleDef[] {
  return BY_POSITION[position] ?? [];
}
