import type { LocalizedText, MatchEventMeta, MatchPresentation, MatchStatRow } from "@/lib/types";

function segmentLabel(kind: string): LocalizedText {
  if (kind.startsWith("ot")) {
    const n = parseInt(kind.slice(2), 10);
    return { ko: `연장${n > 1 ? n : ""}`, en: `OT${n > 1 ? n : ""}` };
  }
  const q = parseInt(kind.slice(1), 10);
  return { ko: `${q}쿼터`, en: `Q${q}` };
}

const META: Record<string, MatchEventMeta> = {
  three: { emoji: "3", label: { ko: "3점슛", en: "3PT" }, tone: "score" },
  two: { emoji: "2", label: { ko: "야투 득점", en: "Field Goal" }, tone: "score" },
  dunk: { emoji: "D", label: { ko: "덩크", en: "Dunk" }, tone: "score" },
  freeThrow: { emoji: "1", label: { ko: "자유투", en: "Free Throw" }, tone: "score" },
  steal: { emoji: "S", label: { ko: "스틸", en: "Steal" }, tone: "info" },
  block: { emoji: "B", label: { ko: "블록", en: "Block" }, tone: "warn" },
  turnover: { emoji: "T", label: { ko: "턴오버", en: "Turnover" }, tone: "warn" },
  rebound: { emoji: "R", label: { ko: "리바운드", en: "Rebound" } },
  fastBreak: { emoji: "F", label: { ko: "속공", en: "Fast Break" }, tone: "info" },
  pickAndRoll: { emoji: "P", label: { ko: "픽앤롤", en: "Pick and Roll" }, tone: "info" },
  isolation: { emoji: "I", label: { ko: "아이솔레이션", en: "Isolation" }, tone: "info" },
  postUp: { emoji: "P", label: { ko: "포스트업", en: "Post-up" }, tone: "info" },
  andOne: { emoji: "+1", label: { ko: "앤드원", en: "And One" }, tone: "score" },
  charge: { emoji: "C", label: { ko: "차징 유도", en: "Charge Drawn" }, tone: "warn" },
  foulTrouble: { emoji: "F", label: { ko: "파울 트러블", en: "Foul Trouble" }, tone: "danger" },
  timeout: { emoji: "TO", label: { ko: "작전타임", en: "Timeout" }, tone: "info" },
  zoneDefense: { emoji: "Z", label: { ko: "지역방어 전환", en: "Zone Defense" }, tone: "info" },
  fullCourtPress: { emoji: "P", label: { ko: "전면 압박", en: "Full-court Press" }, tone: "warn" },
  buzzerBeater: { emoji: "BZ", label: { ko: "버저비터", en: "Buzzer Beater" }, tone: "score" },
  alleyOop: { emoji: "AO", label: { ko: "앨리웁", en: "Alley-oop" }, tone: "score" },
  sixthManRun: { emoji: "6", label: { ko: "식스맨 흐름", en: "Sixth-man Run" }, tone: "info" },
  mismatch: { emoji: "M", label: { ko: "미스매치 공략", en: "Mismatch Attack" }, tone: "info" },
  offBallScreen: { emoji: "SC", label: { ko: "오프볼 스크린", en: "Off-ball Screen" }, tone: "info" },
  doubleTeam: { emoji: "DT", label: { ko: "더블팀", en: "Double Team" }, tone: "info" },
  corner3Setup: { emoji: "C3", label: { ko: "코너 3점 세팅", en: "Corner 3 Setup" }, tone: "info" },
  lobPass: { emoji: "LP", label: { ko: "롭 패스", en: "Lob Pass" }, tone: "info" },
  transitionDefense: { emoji: "TD", label: { ko: "전환 수비", en: "Transition Defense" }, tone: "info" },
  benchSpark: { emoji: "BS", label: { ko: "벤치 활력", en: "Bench Spark" }, tone: "info" },
  clutchTime: { emoji: "CL", label: { ko: "승부처", en: "Clutch Time" }, tone: "info" },
  coachChallenge: { emoji: "CC", label: { ko: "코치 챌린지", en: "Coach Challenge" }, tone: "warn" },
  offensiveFoul: { emoji: "OF", label: { ko: "공격자 파울", en: "Offensive Foul" }, tone: "warn" },
  boxOut: { emoji: "BX", label: { ko: "박스아웃", en: "Box-out" }, tone: "info" },
  drivingLane: { emoji: "DL", label: { ko: "드라이브 레인", en: "Driving Lane" }, tone: "info" },
  perimeterDefense: { emoji: "PD", label: { ko: "외곽 수비", en: "Perimeter Defense" }, tone: "info" },
  paintProtection: { emoji: "PP", label: { ko: "골밑 보호", en: "Paint Protection" }, tone: "info" },
  benchTechnical: { emoji: "BT", label: { ko: "벤치 테크니컬 파울", en: "Bench Technical" }, tone: "danger" },
  shotClockBeat: { emoji: "SCB", label: { ko: "샷클락 비팅", en: "Beats the Shot Clock" }, tone: "info" },
  crossoverMove: { emoji: "XO", label: { ko: "크로스오버", en: "Crossover Move" }, tone: "info" },
  helpDefense: { emoji: "HD", label: { ko: "헬프 디펜스", en: "Help Defense" }, tone: "info" },
  inboundPlay: { emoji: "IB", label: { ko: "인바운드 플레이", en: "Inbound Play" }, tone: "info" },
  freeThrowLine: { emoji: "FL", label: { ko: "자유투 라인 집중", en: "At the Free-throw Line" }, tone: "info" },
  benchMomentum: { emoji: "BM", label: { ko: "벤치 모멘텀", en: "Bench Momentum" }, tone: "info" },
};

const PTS: Record<string, number> = { three: 3, two: 2, dunk: 2, freeThrow: 1 };

export const basketballPresentation: MatchPresentation = {
  venue: "hardwood",
  openLabel: { ko: "팁오프", en: "Tip-off" },
  regulationMinutes: 48,
  endProgress: 48,
  breaks: [
    { at: 12, label: { ko: "1쿼터 종료", en: "End Q1" } },
    { at: 24, label: { ko: "하프타임", en: "Half Time" } },
    { at: 36, label: { ko: "3쿼터 종료", en: "End Q3" } },
  ],
  clockLabel: (p, _end, finished) => {
    if (finished) return "Q4 0:00";
    const q = Math.min(4, Math.floor(p / 12) + 1);
    const within = p - (q - 1) * 12;
    const remain = Math.max(0, 12 - within);
    const mm = Math.floor(remain);
    const ss = Math.floor((remain - mm) * 60);
    return `Q${q} ${mm}:${ss.toString().padStart(2, "0")}`;
  },
  eventMeta: (type) => META[type] ?? { emoji: "*", label: { ko: type, en: type } },
  scoreOf: (events, clubId) => events.reduce((s, e) => (e.clubId === clubId ? s + (PTS[e.type] ?? 0) : s), 0),
  liveStats: (events, homeId): MatchStatRow[] => {
    const c = { h3: 0, a3: 0, hr: 0, ar: 0, hs: 0, as: 0, hb: 0, ab: 0 };
    for (const e of events) {
      const home = e.clubId === homeId;
      if (e.type === "three" || e.type === "buzzerBeater") {
        if (home) c.h3++; else c.a3++;
      } else if (e.type === "rebound") {
        if (home) c.hr++; else c.ar++;
      } else if (e.type === "steal") {
        if (home) c.hs++; else c.as++;
      } else if (e.type === "block") {
        if (home) c.hb++; else c.ab++;
      }
    }
    return [
      { label: { ko: "3점 성공", en: "3PM" }, h: c.h3, a: c.a3 },
      { label: { ko: "리바운드", en: "Rebounds" }, h: c.hr, a: c.ar },
      { label: { ko: "스틸", en: "Steals" }, h: c.hs, a: c.as },
      { label: { ko: "블록", en: "Blocks" }, h: c.hb, a: c.ab },
    ];
  },
  segmentLabel,
  maxSubs: 20,
};
