import type { LocalizedText, MatchEventMeta, MatchPresentation, MatchStatRow } from "@/lib/types";

function segmentLabel(kind: string): LocalizedText {
  const n = parseInt(kind.slice(1), 10);
  return { ko: `${n}회`, en: `${n}` };
}

const META: Record<string, MatchEventMeta> = {
  run: { emoji: "R", label: { ko: "득점", en: "Run" }, tone: "score" },
  homeRun: { emoji: "HR", label: { ko: "홈런", en: "Home Run" }, tone: "score" },
  double: { emoji: "2B", label: { ko: "2루타", en: "Double" }, tone: "info" },
  walk: { emoji: "BB", label: { ko: "볼넷", en: "Walk" } },
  strikeout: { emoji: "K", label: { ko: "삼진", en: "Strikeout" }, tone: "warn" },
  error: { emoji: "E", label: { ko: "실책", en: "Error" }, tone: "danger" },
  steal: { emoji: "SB", label: { ko: "도루", en: "Stolen Base" }, tone: "info" },
  doublePlay: { emoji: "DP", label: { ko: "병살", en: "Double Play" }, tone: "warn" },
  single: { emoji: "1B", label: { ko: "안타", en: "Single" }, tone: "info" },
  triple: { emoji: "3B", label: { ko: "3루타", en: "Triple" }, tone: "info" },
  sacFly: { emoji: "SF", label: { ko: "희생플라이", en: "Sacrifice Fly" }, tone: "score" },
  bunt: { emoji: "B", label: { ko: "번트", en: "Bunt" }, tone: "info" },
  hitByPitch: { emoji: "HBP", label: { ko: "몸에 맞는 공", en: "Hit by Pitch" }, tone: "warn" },
  wildPitch: { emoji: "WP", label: { ko: "폭투", en: "Wild Pitch" }, tone: "danger" },
  moundVisit: { emoji: "MV", label: { ko: "마운드 방문", en: "Mound Visit" }, tone: "info" },
  pitchingChange: { emoji: "PC", label: { ko: "투수 교체", en: "Pitching Change" }, tone: "info" },
  defensiveShift: { emoji: "SH", label: { ko: "수비 시프트", en: "Defensive Shift" }, tone: "info" },
  pickoff: { emoji: "PO", label: { ko: "견제 아웃", en: "Pickoff" }, tone: "warn" },
  divingCatch: { emoji: "DC", label: { ko: "다이빙 캐치", en: "Diving Catch" }, tone: "info" },
  review: { emoji: "RV", label: { ko: "비디오 판독", en: "Replay Review" }, tone: "warn" },
  basesLoaded: { emoji: "BL", label: { ko: "만루 위기", en: "Bases Loaded" }, tone: "danger" },
  firstPitchStrike: { emoji: "FP", label: { ko: "초구 스트라이크", en: "First-pitch Strike" }, tone: "info" },
  fullCount: { emoji: "FC", label: { ko: "풀카운트", en: "Full Count" }, tone: "warn" },
  fieldersChoice: { emoji: "FO", label: { ko: "야수 선택", en: "Fielder's Choice" }, tone: "info" },
  sacrificeBunt: { emoji: "SAC", label: { ko: "희생 번트", en: "Sacrifice Bunt" }, tone: "info" },
  infieldFly: { emoji: "IF", label: { ko: "인필드 플라이", en: "Infield Fly" }, tone: "warn" },
  extraInningTension: { emoji: "EX", label: { ko: "연장전 긴장감", en: "Extra-inning Tension" }, tone: "warn" },
  catcherFraming: { emoji: "CF", label: { ko: "포수 프레이밍", en: "Catcher Framing" }, tone: "info" },
  pinchHitter: { emoji: "PH", label: { ko: "대타 출전", en: "Pinch Hitter" }, tone: "info" },
  relieverWarmup: { emoji: "RW", label: { ko: "구원투수 준비", en: "Reliever Warming Up" }, tone: "info" },
  basesEmpty: { emoji: "BE", label: { ko: "주자 없음", en: "Bases Empty" }, tone: "info" },
  groundRuleDouble: { emoji: "GR", label: { ko: "그라운드 룰 2루타", en: "Ground-rule Double" }, tone: "info" },
  checkSwing: { emoji: "CS", label: { ko: "체크 스윙 판정", en: "Check-swing Call" }, tone: "warn" },
  coveringFirst: { emoji: "C1", label: { ko: "1루 커버 플레이", en: "Covering First" }, tone: "info" },
  relayThrow: { emoji: "RT", label: { ko: "중계 송구", en: "Relay Throw" }, tone: "info" },
  dugoutChatter: { emoji: "DG", label: { ko: "더그아웃 응원", en: "Dugout Chatter" }, tone: "info" },
  battingStanceAdjust: { emoji: "BA", label: { ko: "타격 자세 수정", en: "Stance Adjustment" }, tone: "info" },
  pitchSequencing: { emoji: "PS", label: { ko: "투구 시퀀스 운영", en: "Pitch Sequencing" }, tone: "info" },
  infieldShiftBeat: { emoji: "IS", label: { ko: "시프트를 뚫는 타구", en: "Beats the Shift" }, tone: "info" },
  tagPlay: { emoji: "TG", label: { ko: "태그 플레이 승부", en: "Tag Play" }, tone: "warn" },
  closerEntrance: { emoji: "CE", label: { ko: "마무리 투수 등장", en: "Closer Enters" }, tone: "info" },
};

export const baseballPresentation: MatchPresentation = {
  venue: "diamond",
  openLabel: { ko: "1구 투구", en: "First Pitch" },
  regulationMinutes: 180,
  endProgress: 9,
  breaks: [{ at: 7, label: { ko: "7회 스트레치", en: "7th-Inning Stretch" } }],
  clockLabel: (p, end, finished) => {
    if (finished) return `${end}회 종료`;
    const inning = Math.min(end, Math.floor(p) + 1);
    const half = p - Math.floor(p) < 0.5 ? "초" : "말";
    return `${inning}회 ${half}`;
  },
  eventMeta: (type) => META[type] ?? { emoji: "*", label: { ko: type, en: type } },
  scoreOf: (events, clubId) => events.filter((e) => (e.type === "run" || e.type === "homeRun" || e.type === "sacFly") && e.clubId === clubId).length,
  liveStats: (events, homeId): MatchStatRow[] => {
    const c = { hH: 0, aH: 0, hHr: 0, aHr: 0, hK: 0, aK: 0, hE: 0, aE: 0 };
    for (const e of events) {
      const home = e.clubId === homeId;
      if (["run", "double", "single", "triple"].includes(e.type)) {
        if (home) c.hH++; else c.aH++;
      }
      else if (e.type === "homeRun") { if (home) { c.hH++; c.hHr++; } else { c.aH++; c.aHr++; } }
      else if (e.type === "strikeout") {
        if (home) c.hK++; else c.aK++;
      } else if (e.type === "error") {
        if (home) c.hE++; else c.aE++;
      }
    }
    return [
      { label: { ko: "안타", en: "Hits" }, h: c.hH, a: c.aH },
      { label: { ko: "홈런", en: "HR" }, h: c.hHr, a: c.aHr },
      { label: { ko: "삼진", en: "K" }, h: c.hK, a: c.aK },
      { label: { ko: "실책", en: "Errors" }, h: c.hE, a: c.aE },
    ];
  },
  segmentLabel,
  maxSubs: 9,
};
