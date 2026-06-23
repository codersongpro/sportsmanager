import type { MatchEvent, MatchEventMeta, MatchPresentation, MatchStatRow } from "@/lib/types";

// Visual + label for every soccer event type the sim emits.
const META: Record<string, MatchEventMeta> = {
  goal: { emoji: "⚽", label: { ko: "골", en: "GOAL" }, tone: "score" },
  save: { emoji: "🧤", label: { ko: "선방", en: "Save" }, tone: "info" },
  miss: { emoji: "↗️", label: { ko: "빗나간 슛", en: "Off target" } },
  woodwork: { emoji: "🪵", label: { ko: "골대", en: "Woodwork" }, tone: "warn" },
  corner: { emoji: "🚩", label: { ko: "코너킥", en: "Corner" } },
  freekick: { emoji: "🎯", label: { ko: "프리킥", en: "Free kick" } },
  foul: { emoji: "⚠️", label: { ko: "파울", en: "Foul" } },
  offside: { emoji: "🚫", label: { ko: "오프사이드", en: "Offside" } },
  chance: { emoji: "✨", label: { ko: "기회", en: "Chance" }, tone: "info" },
  yellow: { emoji: "🟨", label: { ko: "경고", en: "Yellow Card" }, tone: "warn" },
  red: { emoji: "🟥", label: { ko: "퇴장", en: "Red Card" }, tone: "danger" },
  injury: { emoji: "🚑", label: { ko: "부상", en: "Injury" }, tone: "danger" },
  penalty_shootout: { emoji: "🥅", label: { ko: "승부차기", en: "Penalties" }, tone: "score" },
};

export const soccerPresentation: MatchPresentation = {
  venue: "pitch",
  endProgress: 90,
  breaks: [{ at: 45, label: { ko: "하프타임", en: "Half Time" } }],
  clockLabel: (p, end, finished) => (finished ? `${end}'` : `${Math.min(Math.floor(p), end)}'`),
  eventMeta: (type) => META[type] ?? { emoji: "•", label: { ko: type, en: type } },
  scoreOf: (events, clubId) => events.filter((e) => e.type === "goal" && e.clubId === clubId).length,
  liveStats: (events, homeId): MatchStatRow[] => {
    let hShots = 0, aShots = 0, hOn = 0, aOn = 0, hCor = 0, aCor = 0, hFoul = 0, aFoul = 0;
    for (const e of events) {
      const isHome = e.clubId === homeId;
      if (e.type === "goal") {
        if (isHome) { hShots++; hOn++; } else { aShots++; aOn++; }
      } else if (e.type === "miss" || e.type === "woodwork") {
        if (isHome) hShots++; else aShots++;
      } else if (e.type === "save") {
        // save credited to defending keeper; the shot came from the attacking end
        if (e.zone === "right") { hShots++; hOn++; } else { aShots++; aOn++; }
      } else if (e.type === "corner") {
        if (isHome) hCor++; else aCor++;
      } else if (e.type === "foul") {
        if (isHome) hFoul++; else aFoul++;
      }
    }
    return [
      { label: { ko: "슈팅", en: "Shots" }, h: hShots, a: aShots },
      { label: { ko: "유효 슈팅", en: "On Target" }, h: hOn, a: aOn },
      { label: { ko: "코너킥", en: "Corners" }, h: hCor, a: aCor },
      { label: { ko: "파울", en: "Fouls" }, h: hFoul, a: aFoul },
    ];
  },
};
