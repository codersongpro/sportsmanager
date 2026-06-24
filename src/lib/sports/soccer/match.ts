import type { MatchEventMeta, MatchPresentation, MatchStatRow } from "@/lib/types";

const META: Record<string, MatchEventMeta> = {
  goal: { emoji: "G", label: { ko: "골", en: "GOAL" }, tone: "score" },
  save: { emoji: "SV", label: { ko: "선방", en: "Save" }, tone: "info" },
  miss: { emoji: "MS", label: { ko: "빗나간 슈팅", en: "Off Target" } },
  woodwork: { emoji: "POST", label: { ko: "골대 강타", en: "Woodwork" }, tone: "warn" },
  corner: { emoji: "CK", label: { ko: "코너킥", en: "Corner" } },
  freekick: { emoji: "FK", label: { ko: "프리킥", en: "Free Kick" } },
  foul: { emoji: "F", label: { ko: "파울", en: "Foul" }, tone: "warn" },
  offside: { emoji: "OS", label: { ko: "오프사이드", en: "Offside" } },
  chance: { emoji: "CH", label: { ko: "결정적 기회", en: "Chance" }, tone: "info" },
  yellow: { emoji: "YC", label: { ko: "경고", en: "Yellow Card" }, tone: "warn" },
  red: { emoji: "RC", label: { ko: "퇴장", en: "Red Card" }, tone: "danger" },
  injury: { emoji: "INJ", label: { ko: "부상", en: "Injury" }, tone: "danger" },
  penalty_shootout: { emoji: "PK", label: { ko: "승부차기", en: "Penalties" }, tone: "score" },
  pressWin: { emoji: "PR", label: { ko: "압박 성공", en: "Press Win" }, tone: "info" },
  throughBall: { emoji: "TB", label: { ko: "스루패스", en: "Through Ball" }, tone: "info" },
  cross: { emoji: "CR", label: { ko: "크로스", en: "Cross" }, tone: "info" },
  counter: { emoji: "CT", label: { ko: "역습", en: "Counter" }, tone: "info" },
  varCheck: { emoji: "VAR", label: { ko: "VAR 판독", en: "VAR Check" }, tone: "warn" },
  substitution: { emoji: "SUB", label: { ko: "교체 준비", en: "Substitution" }, tone: "info" },
  tacticalShift: { emoji: "TAC", label: { ko: "전술 변화", en: "Tactical Shift" }, tone: "info" },
  longShot: { emoji: "LS", label: { ko: "중거리 슛", en: "Long Shot" }, tone: "info" },
  dribble: { emoji: "DR", label: { ko: "돌파", en: "Dribble" }, tone: "info" },
  clearance: { emoji: "CL", label: { ko: "걷어내기", en: "Clearance" }, tone: "warn" },
  throughPress: { emoji: "TP", label: { ko: "압박 탈출", en: "Play Through Press" }, tone: "info" },
  setPiece: { emoji: "SP", label: { ko: "세트피스 패턴", en: "Set Piece" }, tone: "info" },
};

export const soccerPresentation: MatchPresentation = {
  venue: "pitch",
  regulationMinutes: 90,
  endProgress: 90,
  breaks: [{ at: 45, label: { ko: "하프타임", en: "Half Time" } }],
  clockLabel: (p, end, finished) => (finished ? `${end}'` : `${Math.min(Math.floor(p), end)}'`),
  eventMeta: (type) => META[type] ?? { emoji: "*", label: { ko: type, en: type } },
  scoreOf: (events, clubId) => events.filter((e) => e.type === "goal" && e.clubId === clubId).length,
  liveStats: (events, homeId): MatchStatRow[] => {
    let hShots = 0, aShots = 0, hOn = 0, aOn = 0, hCor = 0, aCor = 0, hFoul = 0, aFoul = 0;
    for (const e of events) {
      const isHome = e.clubId === homeId;
      if (e.type === "goal") {
        if (isHome) { hShots++; hOn++; } else { aShots++; aOn++; }
      } else if (e.type === "miss" || e.type === "woodwork" || e.type === "longShot") {
        if (isHome) hShots++; else aShots++;
      } else if (e.type === "save") {
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
