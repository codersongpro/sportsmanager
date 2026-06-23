import type { MatchEventMeta, MatchPresentation, MatchStatRow } from "@/lib/types";

const META: Record<string, MatchEventMeta> = {
  run: { emoji: "⚾", label: { ko: "득점", en: "Run" }, tone: "score" },
  homeRun: { emoji: "💣", label: { ko: "홈런", en: "Home Run" }, tone: "score" },
  double: { emoji: "↗️", label: { ko: "2루타", en: "Double" }, tone: "info" },
  walk: { emoji: "🚶", label: { ko: "볼넷", en: "Walk" } },
  strikeout: { emoji: "🔥", label: { ko: "삼진", en: "Strikeout" }, tone: "warn" },
  error: { emoji: "🧤", label: { ko: "실책", en: "Error" }, tone: "danger" },
  steal: { emoji: "💨", label: { ko: "도루", en: "Stolen Base" }, tone: "info" },
  doublePlay: { emoji: "✌️", label: { ko: "병살", en: "Double Play" }, tone: "warn" },
};

export const baseballPresentation: MatchPresentation = {
  venue: "diamond",
  endProgress: 9,
  breaks: [{ at: 7, label: { ko: "7회 스트레치", en: "7th-Inning Stretch" } }],
  clockLabel: (p, end, finished) => {
    if (finished) return `${end}회`;
    const inning = Math.min(end, Math.floor(p) + 1);
    const half = p - Math.floor(p) < 0.5 ? "초" : "말";
    return `${inning}회${half}`;
  },
  eventMeta: (type) => META[type] ?? { emoji: "•", label: { ko: type, en: type } },
  scoreOf: (events, clubId) => events.filter((e) => (e.type === "run" || e.type === "homeRun") && e.clubId === clubId).length,
  liveStats: (events, homeId): MatchStatRow[] => {
    const c = { hH: 0, aH: 0, hHr: 0, aHr: 0, hK: 0, aK: 0, hE: 0, aE: 0 };
    for (const e of events) {
      const home = e.clubId === homeId;
      if (e.type === "run" || e.type === "double") home ? c.hH++ : c.aH++;
      else if (e.type === "homeRun") { if (home) { c.hH++; c.hHr++; } else { c.aH++; c.aHr++; } }
      else if (e.type === "strikeout") home ? c.hK++ : c.aK++;
      else if (e.type === "error") home ? c.hE++ : c.aE++;
    }
    return [
      { label: { ko: "안타", en: "Hits" }, h: c.hH, a: c.aH },
      { label: { ko: "홈런", en: "HR" }, h: c.hHr, a: c.aHr },
      { label: { ko: "삼진", en: "K" }, h: c.hK, a: c.aK },
      { label: { ko: "실책", en: "Errors" }, h: c.hE, a: c.aE },
    ];
  },
};
