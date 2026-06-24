import type { MatchEventMeta, MatchPresentation, MatchStatRow } from "@/lib/types";

const META: Record<string, MatchEventMeta> = {
  gameWon: { emoji: "GW", label: { ko: "게임 승리", en: "Game Won" }, tone: "score" },
  winner: { emoji: "W", label: { ko: "위너", en: "Winner" }, tone: "info" },
  ace: { emoji: "A", label: { ko: "서브 에이스", en: "Ace" }, tone: "score" },
  smash: { emoji: "S", label: { ko: "스매시", en: "Smash" }, tone: "info" },
  dink: { emoji: "D", label: { ko: "딩크", en: "Dink" } },
  fault: { emoji: "F", label: { ko: "폴트", en: "Fault" }, tone: "danger" },
  thirdShotDrop: { emoji: "3D", label: { ko: "서드샷 드롭", en: "Third-shot Drop" }, tone: "info" },
  kitchenViolation: { emoji: "KV", label: { ko: "키친 반칙", en: "Kitchen Violation" }, tone: "warn" },
  sideOut: { emoji: "SO", label: { ko: "사이드아웃", en: "Side-out" }, tone: "warn" },
  erne: { emoji: "ER", label: { ko: "어니 공격", en: "Erne" }, tone: "info" },
  lob: { emoji: "L", label: { ko: "롭", en: "Lob" }, tone: "info" },
  reset: { emoji: "RS", label: { ko: "리셋", en: "Reset" }, tone: "info" },
  speedUp: { emoji: "SU", label: { ko: "스피드업", en: "Speed-up" }, tone: "info" },
  poach: { emoji: "P", label: { ko: "포치", en: "Poach" }, tone: "info" },
  aroundPost: { emoji: "ATP", label: { ko: "포스트 바깥 샷", en: "Around-the-post" }, tone: "info" },
  bodyShot: { emoji: "BS", label: { ko: "바디샷", en: "Body Shot" }, tone: "warn" },
  serviceFault: { emoji: "SF", label: { ko: "서브 폴트", en: "Service Fault" }, tone: "danger" },
  footFault: { emoji: "FF", label: { ko: "풋 폴트", en: "Foot Fault" }, tone: "danger" },
  timeout: { emoji: "TO", label: { ko: "작전타임", en: "Timeout" }, tone: "info" },
  challenge: { emoji: "CH", label: { ko: "라인 판독", en: "Line Challenge" }, tone: "warn" },
  longRally: { emoji: "LR", label: { ko: "롱 랠리", en: "Long Rally" }, tone: "info" },
  dropShotBattle: { emoji: "DS", label: { ko: "드롭샷 공방", en: "Drop-shot Battle" }, tone: "info" },
  paddleAngle: { emoji: "PA", label: { ko: "패들 각도 조절", en: "Paddle Angle Adjustment" }, tone: "info" },
  nonVolleyLine: { emoji: "NV", label: { ko: "키친 라인 압박", en: "Pressure at the Kitchen Line" }, tone: "info" },
  atpAttempt: { emoji: "AT", label: { ko: "포스트 회피 시도", en: "Around-the-post Attempt" }, tone: "info" },
  servingDepth: { emoji: "SD", label: { ko: "깊은 서브", en: "Deep Serve" }, tone: "info" },
  softGame: { emoji: "SG", label: { ko: "소프트 게임 운영", en: "Soft-game Play" }, tone: "info" },
  paddleSwitch: { emoji: "PS", label: { ko: "패들 교체", en: "Paddle Switch" }, tone: "info" },
  stackingFormation: { emoji: "SF2", label: { ko: "스태킹 포메이션", en: "Stacking Formation" }, tone: "info" },
  communicationCall: { emoji: "CC", label: { ko: "콜 사인", en: "Communication Call" }, tone: "info" },
  patientRally: { emoji: "PR", label: { ko: "인내심 있는 랠리", en: "Patient Rally" }, tone: "info" },
  dinkBattle: { emoji: "DB", label: { ko: "딩크 대결", en: "Dink Battle" }, tone: "info" },
  forehandRoll: { emoji: "FH", label: { ko: "포핸드 롤샷", en: "Forehand Roll" }, tone: "info" },
  backhandFlick: { emoji: "BF", label: { ko: "백핸드 플릭", en: "Backhand Flick" }, tone: "info" },
  courtPositioning: { emoji: "CP", label: { ko: "코트 포지셔닝", en: "Court Positioning" }, tone: "info" },
  paddleContact: { emoji: "PC", label: { ko: "정확한 패들 컨택", en: "Clean Paddle Contact" }, tone: "info" },
  switchSides: { emoji: "SS", label: { ko: "좌우 스위치", en: "Switching Sides" }, tone: "info" },
  momentumShift: { emoji: "MS", label: { ko: "분위기 전환", en: "Momentum Shift" }, tone: "info" },
  crowdReaction: { emoji: "CR", label: { ko: "관중 반응", en: "Crowd Reaction" }, tone: "info" },
  timeoutStrategy: { emoji: "TS", label: { ko: "작전타임 전략 회의", en: "Timeout Strategy" }, tone: "info" },
  matchPointPressure: { emoji: "MP", label: { ko: "매치포인트 압박감", en: "Match-point Pressure" }, tone: "warn" },
};

export const pickleballPresentation: MatchPresentation = {
  venue: "pickleballCourt",
  openLabel: { ko: "첫 서브", en: "First Serve" },
  regulationMinutes: 45,
  endProgress: 3,
  breaks: [
    { at: 1, label: { ko: "1게임 종료", en: "End Game 1" } },
    { at: 2, label: { ko: "2게임 종료", en: "End Game 2" } },
  ],
  clockLabel: (p, end, finished) => (finished ? `${end}게임 종료` : `${Math.min(3, Math.floor(p) + 1)}게임`),
  eventMeta: (type) => META[type] ?? { emoji: "*", label: { ko: type, en: type } },
  scoreOf: (events, clubId) => events.filter((e) => e.type === "gameWon" && e.clubId === clubId).length,
  liveStats: (events, homeId): MatchStatRow[] => {
    const c = { hW: 0, aW: 0, hA: 0, aA: 0, hD: 0, aD: 0, hF: 0, aF: 0 };
    for (const e of events) {
      const home = e.clubId === homeId;
      if (["winner", "smash", "erne", "aroundPost"].includes(e.type)) {
        if (home) c.hW++; else c.aW++;
      } else if (e.type === "ace") {
        if (home) c.hA++; else c.aA++;
      } else if (["dink", "thirdShotDrop", "reset"].includes(e.type)) {
        if (home) c.hD++; else c.aD++;
      } else if (["fault", "serviceFault", "footFault", "kitchenViolation"].includes(e.type)) {
        if (home) c.hF++; else c.aF++;
      }
    }
    return [
      { label: { ko: "위너", en: "Winners" }, h: c.hW, a: c.aW },
      { label: { ko: "서브 에이스", en: "Aces" }, h: c.hA, a: c.aA },
      { label: { ko: "딩크/리셋", en: "Dinks" }, h: c.hD, a: c.aD },
      { label: { ko: "폴트", en: "Faults" }, h: c.hF, a: c.aF },
    ];
  },
};
