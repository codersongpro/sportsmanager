import type { MatchEventMeta, MatchPresentation, MatchStatRow } from "@/lib/types";

const META: Record<string, MatchEventMeta> = {
  three: { emoji: "🎯", label: { ko: "3점", en: "3PT" }, tone: "score" },
  two: { emoji: "🏀", label: { ko: "득점", en: "Bucket" }, tone: "score" },
  dunk: { emoji: "💥", label: { ko: "덩크", en: "Dunk" }, tone: "score" },
  freeThrow: { emoji: "🆓", label: { ko: "자유투", en: "Free Throw" }, tone: "score" },
  steal: { emoji: "🖐️", label: { ko: "스틸", en: "Steal" }, tone: "info" },
  block: { emoji: "🚫", label: { ko: "블록", en: "Block" }, tone: "warn" },
  turnover: { emoji: "🔄", label: { ko: "턴오버", en: "Turnover" } },
  rebound: { emoji: "↩️", label: { ko: "리바운드", en: "Rebound" } },
};

const PTS: Record<string, number> = { three: 3, two: 2, dunk: 2, freeThrow: 1 };

export const basketballPresentation: MatchPresentation = {
  venue: "hardwood",
  endProgress: 48,
  breaks: [
    { at: 12, label: { ko: "1쿼터 종료", en: "End Q1" } },
    { at: 24, label: { ko: "하프타임", en: "Half Time" } },
    { at: 36, label: { ko: "3쿼터 종료", en: "End Q3" } },
  ],
  clockLabel: (p, end, finished) => {
    if (finished) return "Q4 0:00";
    const q = Math.min(4, Math.floor(p / 12) + 1);
    const within = p - (q - 1) * 12;
    const remain = Math.max(0, 12 - within);
    const mm = Math.floor(remain);
    const ss = Math.floor((remain - mm) * 60);
    return `Q${q} ${mm}:${ss.toString().padStart(2, "0")}`;
  },
  eventMeta: (type) => META[type] ?? { emoji: "•", label: { ko: type, en: type } },
  scoreOf: (events, clubId) => events.reduce((s, e) => (e.clubId === clubId ? s + (PTS[e.type] ?? 0) : s), 0),
  liveStats: (events, homeId): MatchStatRow[] => {
    const c = { h3: 0, a3: 0, hr: 0, ar: 0, hs: 0, as: 0, hb: 0, ab: 0 };
    for (const e of events) {
      const home = e.clubId === homeId;
      if (e.type === "three") home ? c.h3++ : c.a3++;
      else if (e.type === "rebound") home ? c.hr++ : c.ar++;
      else if (e.type === "steal") home ? c.hs++ : c.as++;
      else if (e.type === "block") home ? c.hb++ : c.ab++;
    }
    return [
      { label: { ko: "3점", en: "3PM" }, h: c.h3, a: c.a3 },
      { label: { ko: "리바운드", en: "Rebounds" }, h: c.hr, a: c.ar },
      { label: { ko: "스틸", en: "Steals" }, h: c.hs, a: c.as },
      { label: { ko: "블록", en: "Blocks" }, h: c.hb, a: c.ab },
    ];
  },
};
