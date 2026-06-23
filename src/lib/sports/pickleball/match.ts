import type { MatchEventMeta, MatchPresentation, MatchStatRow } from "@/lib/types";

const META: Record<string, MatchEventMeta> = {
  gameWon: { emoji: "🏆", label: { ko: "게임 획득", en: "Game Won" }, tone: "score" },
  winner: { emoji: "🎾", label: { ko: "위너", en: "Winner" }, tone: "info" },
  ace: { emoji: "🎯", label: { ko: "에이스", en: "Ace" }, tone: "score" },
  smash: { emoji: "💥", label: { ko: "스매시", en: "Smash" }, tone: "info" },
  dink: { emoji: "🪶", label: { ko: "딩크", en: "Dink" } },
  fault: { emoji: "❌", label: { ko: "범실", en: "Fault" }, tone: "danger" },
};

export const pickleballPresentation: MatchPresentation = {
  venue: "net",
  endProgress: 2,
  breaks: [
    { at: 1, label: { ko: "1게임 종료", en: "End Game 1" } },
    { at: 2, label: { ko: "2게임 종료", en: "End Game 2" } },
  ],
  clockLabel: (p, end, finished) => (finished ? `${end}게임` : `${Math.min(3, Math.floor(p) + 1)}게임`),
  eventMeta: (type) => META[type] ?? { emoji: "•", label: { ko: type, en: type } },
  scoreOf: (events, clubId) => events.filter((e) => e.type === "gameWon" && e.clubId === clubId).length,
  liveStats: (events, homeId): MatchStatRow[] => {
    const c = { hW: 0, aW: 0, hA: 0, aA: 0, hD: 0, aD: 0, hF: 0, aF: 0 };
    for (const e of events) {
      const home = e.clubId === homeId;
      if (e.type === "winner" || e.type === "smash") home ? c.hW++ : c.aW++;
      else if (e.type === "ace") home ? c.hA++ : c.aA++;
      else if (e.type === "dink") home ? c.hD++ : c.aD++;
      else if (e.type === "fault") home ? c.hF++ : c.aF++;
    }
    return [
      { label: { ko: "위너", en: "Winners" }, h: c.hW, a: c.aW },
      { label: { ko: "에이스", en: "Aces" }, h: c.hA, a: c.aA },
      { label: { ko: "딩크 득점", en: "Dinks" }, h: c.hD, a: c.aD },
      { label: { ko: "범실", en: "Faults" }, h: c.hF, a: c.aF },
    ];
  },
};
