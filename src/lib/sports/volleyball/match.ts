import type { MatchEventMeta, MatchPresentation, MatchStatRow } from "@/lib/types";

const META: Record<string, MatchEventMeta> = {
  setWon: { emoji: "🏆", label: { ko: "세트 획득", en: "Set Won" }, tone: "score" },
  spike: { emoji: "🏐", label: { ko: "스파이크", en: "Spike" }, tone: "info" },
  ace: { emoji: "🎯", label: { ko: "서브 에이스", en: "Ace" }, tone: "score" },
  block: { emoji: "🧱", label: { ko: "블로킹", en: "Block" }, tone: "warn" },
  dig: { emoji: "🤾", label: { ko: "디그", en: "Dig" } },
  error: { emoji: "❌", label: { ko: "범실", en: "Error" }, tone: "danger" },
};

export const volleyballPresentation: MatchPresentation = {
  venue: "net",
  endProgress: 3,
  breaks: [
    { at: 1, label: { ko: "1세트 종료", en: "End Set 1" } },
    { at: 2, label: { ko: "2세트 종료", en: "End Set 2" } },
    { at: 3, label: { ko: "3세트 종료", en: "End Set 3" } },
    { at: 4, label: { ko: "4세트 종료", en: "End Set 4" } },
  ],
  clockLabel: (p, end, finished) => (finished ? `${end}세트` : `${Math.min(5, Math.floor(p) + 1)}세트`),
  eventMeta: (type) => META[type] ?? { emoji: "•", label: { ko: type, en: type } },
  scoreOf: (events, clubId) => events.filter((e) => e.type === "setWon" && e.clubId === clubId).length,
  liveStats: (events, homeId): MatchStatRow[] => {
    const c = { hSp: 0, aSp: 0, hAce: 0, aAce: 0, hBl: 0, aBl: 0, hDg: 0, aDg: 0 };
    for (const e of events) {
      const home = e.clubId === homeId;
      if (e.type === "spike") home ? c.hSp++ : c.aSp++;
      else if (e.type === "ace") home ? c.hAce++ : c.aAce++;
      else if (e.type === "block") home ? c.hBl++ : c.aBl++;
      else if (e.type === "dig") home ? c.hDg++ : c.aDg++;
    }
    return [
      { label: { ko: "스파이크", en: "Kills" }, h: c.hSp, a: c.aSp },
      { label: { ko: "서브에이스", en: "Aces" }, h: c.hAce, a: c.aAce },
      { label: { ko: "블로킹", en: "Blocks" }, h: c.hBl, a: c.aBl },
      { label: { ko: "디그", en: "Digs" }, h: c.hDg, a: c.aDg },
    ];
  },
};
