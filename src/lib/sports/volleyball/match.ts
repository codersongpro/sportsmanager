import type { LocalizedText, MatchEventMeta, MatchPresentation, MatchStatRow } from "@/lib/types";

function segmentLabel(kind: string): LocalizedText {
  const n = parseInt(kind.slice(1), 10);
  return { ko: `${n}세트`, en: `Set ${n}` };
}

const META: Record<string, MatchEventMeta> = {
  setWon: { emoji: "SW", label: { ko: "세트 승리", en: "Set Won" }, tone: "score" },
  spike: { emoji: "K", label: { ko: "스파이크", en: "Spike" }, tone: "info" },
  ace: { emoji: "A", label: { ko: "서브 에이스", en: "Ace" }, tone: "score" },
  block: { emoji: "B", label: { ko: "블로킹", en: "Block" }, tone: "warn" },
  dig: { emoji: "D", label: { ko: "디그", en: "Dig" } },
  error: { emoji: "E", label: { ko: "범실", en: "Error" }, tone: "danger" },
  quickAttack: { emoji: "Q", label: { ko: "속공", en: "Quick Attack" }, tone: "info" },
  pipeAttack: { emoji: "P", label: { ko: "파이프 공격", en: "Pipe Attack" }, tone: "info" },
  tip: { emoji: "T", label: { ko: "연타", en: "Tip" }, tone: "info" },
  receiveAce: { emoji: "RA", label: { ko: "리시브 흔들림", en: "Receive Breakdown" }, tone: "danger" },
  setterDump: { emoji: "SD", label: { ko: "세터 페인트", en: "Setter Dump" }, tone: "info" },
  doubleContact: { emoji: "DC", label: { ko: "더블 컨택", en: "Double Contact" }, tone: "warn" },
  netTouch: { emoji: "NT", label: { ko: "네트 터치", en: "Net Touch" }, tone: "warn" },
  rotationFault: { emoji: "RF", label: { ko: "로테이션 반칙", en: "Rotation Fault" }, tone: "danger" },
  challenge: { emoji: "CH", label: { ko: "비디오 판독", en: "Challenge" }, tone: "warn" },
  timeout: { emoji: "TO", label: { ko: "작전타임", en: "Timeout" }, tone: "info" },
  substitution: { emoji: "SUB", label: { ko: "선수 교체", en: "Substitution" }, tone: "info" },
  serveRun: { emoji: "SR", label: { ko: "연속 서브 득점 흐름", en: "Serve Run" }, tone: "score" },
  joust: { emoji: "J", label: { ko: "네트 위 경합", en: "Joust" }, tone: "info" },
  pancake: { emoji: "PK", label: { ko: "팬케이크 리시브", en: "Pancake Save" }, tone: "info" },
  overpass: { emoji: "OP", label: { ko: "오버패스", en: "Overpass" }, tone: "warn" },
  floatServe: { emoji: "FS", label: { ko: "플로터 서브", en: "Float Serve" }, tone: "info" },
  jumpServe: { emoji: "JS", label: { ko: "점프 서브", en: "Jump Serve" }, tone: "info" },
  transitionAttack: { emoji: "TA", label: { ko: "전환 공격", en: "Transition Attack" }, tone: "info" },
  backRowDefense: { emoji: "BD", label: { ko: "후위 수비", en: "Back-row Defense" }, tone: "info" },
  setterDecision: { emoji: "SE", label: { ko: "세터의 선택", en: "Setter's Decision" }, tone: "info" },
  middleBlock: { emoji: "MB", label: { ko: "미들 블로킹", en: "Middle Block" }, tone: "warn" },
  liberoDig: { emoji: "LD", label: { ko: "리베로 수비", en: "Libero Dig" }, tone: "info" },
  servingRotation: { emoji: "SR2", label: { ko: "서빙 로테이션", en: "Serving Rotation" }, tone: "info" },
  crossCourtShot: { emoji: "CC", label: { ko: "대각 공격", en: "Cross-court Shot" }, tone: "info" },
  lineShot: { emoji: "LN", label: { ko: "라인 공격", en: "Line Shot" }, tone: "info" },
  blockTouch: { emoji: "BT", label: { ko: "블로킹 터치", en: "Block Touch" }, tone: "info" },
  coachInstruction: { emoji: "CI", label: { ko: "감독 지시", en: "Coach Instruction" }, tone: "info" },
  servePressure: { emoji: "SP", label: { ko: "서브 압박", en: "Serve Pressure" }, tone: "warn" },
  freeBall: { emoji: "FB", label: { ko: "프리볼", en: "Free Ball" }, tone: "info" },
  coveringHitter: { emoji: "CV", label: { ko: "공격수 커버", en: "Covering the Hitter" }, tone: "info" },
  outOfSystem: { emoji: "OS", label: { ko: "시스템 붕괴 수비", en: "Out-of-system Play" }, tone: "warn" },
  blockingScheme: { emoji: "BS", label: { ko: "블로킹 전략 조정", en: "Blocking Scheme" }, tone: "info" },
  servingSpecialist: { emoji: "SS", label: { ko: "서브 전문 요원 투입", en: "Serving Specialist" }, tone: "info" },
  momentumSwing: { emoji: "MS", label: { ko: "분위기 반전", en: "Momentum Swing" }, tone: "info" },
  matchPointTension: { emoji: "MP", label: { ko: "매치포인트 긴장감", en: "Match-point Tension" }, tone: "warn" },
};

export const volleyballPresentation: MatchPresentation = {
  venue: "volleyballCourt",
  openLabel: { ko: "첫 서브", en: "First Serve" },
  regulationMinutes: 100,
  endProgress: 5,
  breaks: [
    { at: 1, label: { ko: "1세트 종료", en: "End Set 1" } },
    { at: 2, label: { ko: "2세트 종료", en: "End Set 2" } },
    { at: 3, label: { ko: "3세트 종료", en: "End Set 3" } },
    { at: 4, label: { ko: "4세트 종료", en: "End Set 4" } },
  ],
  clockLabel: (p, end, finished) => (finished ? `${end}세트 종료` : `${Math.min(5, Math.floor(p) + 1)}세트`),
  eventMeta: (type) => META[type] ?? { emoji: "*", label: { ko: type, en: type } },
  scoreOf: (events, clubId) => events.filter((e) => e.type === "setWon" && e.clubId === clubId).length,
  liveStats: (events, homeId): MatchStatRow[] => {
    const c = { hSp: 0, aSp: 0, hAce: 0, aAce: 0, hBl: 0, aBl: 0, hDg: 0, aDg: 0 };
    for (const e of events) {
      const home = e.clubId === homeId;
      if (["spike", "quickAttack", "pipeAttack"].includes(e.type)) {
        if (home) c.hSp++; else c.aSp++;
      } else if (e.type === "ace") {
        if (home) c.hAce++; else c.aAce++;
      } else if (e.type === "block") {
        if (home) c.hBl++; else c.aBl++;
      } else if (e.type === "dig" || e.type === "pancake") {
        if (home) c.hDg++; else c.aDg++;
      }
    }
    return [
      { label: { ko: "공격 득점", en: "Kills" }, h: c.hSp, a: c.aSp },
      { label: { ko: "서브 에이스", en: "Aces" }, h: c.hAce, a: c.aAce },
      { label: { ko: "블로킹", en: "Blocks" }, h: c.hBl, a: c.aBl },
      { label: { ko: "디그", en: "Digs" }, h: c.hDg, a: c.aDg },
    ];
  },
  segmentLabel,
  maxSubs: 6,
};
