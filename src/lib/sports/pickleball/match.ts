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
};

export const pickleballPresentation: MatchPresentation = {
  venue: "pickleballCourt",
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
