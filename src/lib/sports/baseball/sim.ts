import type { LocalizedText, MatchEvent, MatchResult, MatchSegmentResult, MatchTeam, Player, PitchZone, SimOptions } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { avgAttr, buildPool, phrase, poisson, pick, type Pool } from "../common/simutil";
import { BSB_POSITION_GROUP } from "./constants";

type Pool2 = LocalizedText[];

interface Side {
  batRating: number;
  pitchRating: number;
  batters: Pool;
  powerHitters: Pool;
  pitcher?: Player;
}

function isP(p: Player): boolean {
  return BSB_POSITION_GROUP[p.positions[0] ?? "DH"] === "P";
}

function side(team: MatchTeam): Side {
  const batters = team.lineup.filter((p) => !isP(p));
  const bl = batters.length ? batters : team.lineup;
  const batRating = bl.reduce((s, p) => s + (p.attributes.contact ?? 40) + (p.attributes.power ?? 40) * 0.8 + (p.attributes.eye ?? 40) * 0.5, 0) / (bl.length * 2.3);
  const pitcher = team.lineup.find(isP);
  const pitchRating = pitcher
    ? ((pitcher.attributes.velocity ?? 40) + (pitcher.attributes.control ?? 40) + (pitcher.attributes.movement ?? 40)) / 3
    : avgAttr(team.lineup, "fielding");
  return {
    batRating,
    pitchRating,
    batters: buildPool(bl, (p) => 0.5 + ((p.attributes.contact ?? 40) + (p.attributes.power ?? 40)) / 200),
    powerHitters: buildPool(bl, (p) => 0.3 + (p.attributes.power ?? 40) / 90),
    pitcher,
  };
}

const HIT: Pool2 = [{ ko: "적시타! 주자가 홈을 밟습니다.", en: "RBI hit! A run scores!" }, { ko: "중전 안타로 득점합니다.", en: "Base hit brings one home!" }];
const HR: Pool2 = [{ ko: "홈런! 담장을 넘깁니다.", en: "HOME RUN! Gone!" }, { ko: "높게 뻗은 타구가 홈런이 됩니다.", en: "A towering blast, home run!" }];
const SO: Pool2 = [{ ko: "삼진 아웃! 타자를 돌려세웁니다.", en: "Strikeout! Sits him down." }];
const BB: Pool2 = [{ ko: "볼넷으로 출루합니다.", en: "Draws a walk." }];
const DOUBLE: Pool2 = [{ ko: "2루타! 타구가 외야 깊숙이 향합니다.", en: "Rips a double into the gap." }];
const ERR: Pool2 = [{ ko: "실책! 수비 실수가 나옵니다.", en: "Error! A misplay in the field." }];
const STEAL: Pool2 = [{ ko: "도루 성공!", en: "Steals the base!" }];
const DP: Pool2 = [{ ko: "병살타! 두 명을 잡아냅니다.", en: "Double play! Two down." }];
const EXTRA: { type: string; detail: Pool2 }[] = [
  { type: "single", detail: [{ ko: "깔끔한 안타로 출루합니다.", en: "Punches a clean single." }] },
  { type: "triple", detail: [{ ko: "외야 깊숙한 타구로 3루까지 내달립니다.", en: "Races into third with a triple." }] },
  { type: "bunt", detail: [{ ko: "번트로 주자를 진루시킵니다.", en: "Lays down a useful bunt." }] },
  { type: "hitByPitch", detail: [{ ko: "몸에 맞는 공으로 출루합니다.", en: "Takes one off the body." }] },
  { type: "wildPitch", detail: [{ ko: "폭투가 나오며 주자가 움직입니다.", en: "A wild pitch lets the runner advance." }] },
  { type: "moundVisit", detail: [{ ko: "포수가 마운드에 올라 흐름을 끊습니다.", en: "The catcher heads out for a mound visit." }] },
  { type: "pitchingChange", detail: [{ ko: "불펜에서 새 투수가 올라옵니다.", en: "A new arm comes in from the bullpen." }] },
  { type: "defensiveShift", detail: [{ ko: "타구 성향에 맞춰 수비 시프트를 겁니다.", en: "The defense shifts for the hitter." }] },
  { type: "pickoff", detail: [{ ko: "빠른 견제로 주자를 묶어둡니다.", en: "A sharp pickoff move keeps the runner close." }] },
  { type: "divingCatch", detail: [{ ko: "다이빙 캐치로 장타를 지웁니다.", en: "A diving catch steals extra bases." }] },
  { type: "review", detail: [{ ko: "비디오 판독으로 판정이 확인됩니다.", en: "Replay review confirms the call." }] },
  { type: "basesLoaded", detail: [{ ko: "만루 위기에서 승부가 이어집니다.", en: "Bases loaded pressure builds." }] },
  { type: "firstPitchStrike", detail: [{ ko: "초구를 스트라이크로 잡아냅니다.", en: "Gets ahead with a first-pitch strike." }] },
  { type: "fullCount", detail: [{ ko: "풀카운트까지 가는 끈질긴 승부입니다.", en: "Battles all the way to a full count." }] },
  { type: "fieldersChoice", detail: [{ ko: "야수 선택으로 주자를 아웃시킵니다.", en: "A fielder's choice cuts down the runner." }] },
  { type: "sacrificeBunt", detail: [{ ko: "희생 번트로 주자를 한 베이스 보냅니다.", en: "A sacrifice bunt moves the runner over." }] },
  { type: "infieldFly", detail: [{ ko: "인필드 플라이가 선언됩니다.", en: "The infield fly rule is called." }] },
  { type: "extraInningTension", detail: [{ ko: "연장전 긴장감이 감돕니다.", en: "Tension rises in extra innings." }] },
  { type: "catcherFraming", detail: [{ ko: "포수가 절묘한 프레이밍으로 스트라이크를 만듭니다.", en: "Smart framing steals a strike." }] },
  { type: "pinchHitter", detail: [{ ko: "결정적인 순간 대타가 나섭니다.", en: "A pinch hitter steps in at a big moment." }] },
  { type: "relieverWarmup", detail: [{ ko: "불펜에서 구원투수가 몸을 풉니다.", en: "A reliever warms up in the bullpen." }] },
  { type: "basesEmpty", detail: [{ ko: "주자 없는 상황에서 가볍게 승부합니다.", en: "Pitches freely with the bases empty." }] },
  { type: "groundRuleDouble", detail: [{ ko: "그라운드 룰 2루타가 선언됩니다.", en: "A ground-rule double is called." }] },
  { type: "checkSwing", detail: [{ ko: "체크 스윙 판정을 두고 항의가 나옵니다.", en: "An argument breaks out over the check-swing call." }] },
  { type: "coveringFirst", detail: [{ ko: "투수가 1루 커버에 들어갑니다.", en: "The pitcher hustles over to cover first." }] },
  { type: "relayThrow", detail: [{ ko: "정확한 중계 송구로 주자를 잡습니다.", en: "A perfect relay throw nails the runner." }] },
  { type: "dugoutChatter", detail: [{ ko: "더그아웃에서 응원의 목소리가 커집니다.", en: "The dugout chatter picks up." }] },
  { type: "battingStanceAdjust", detail: [{ ko: "타석에서 타격 자세를 조정합니다.", en: "Adjusts the batting stance mid at-bat." }] },
  { type: "pitchSequencing", detail: [{ ko: "투수가 절묘한 구종 배합을 이어갑니다.", en: "The pitcher mixes his sequence beautifully." }] },
  { type: "infieldShiftBeat", detail: [{ ko: "시프트를 뚫는 타구가 나옵니다.", en: "A grounder beats the shift." }] },
  { type: "tagPlay", detail: [{ ko: "베이스에서 태그 플레이 승부가 펼쳐집니다.", en: "A close tag play at the bag." }] },
  { type: "closerEntrance", detail: [{ ko: "9회 마무리 투수가 등장합니다.", en: "The closer enters for the ninth." }] },
];

function halfInningLambda(bat: number, pitch: number, homeBatting: boolean, inning: number): number {
  const base = 0.48 * Math.pow(bat / Math.max(28, pitch), 1.22);
  const leverage = inning >= 7 ? 1.08 : 1;
  return Math.max(0.04, Math.min(2.4, base * leverage + (homeBatting ? 0.03 : 0)));
}

function halfMinute(inning: number, top: boolean, offset: number): number {
  return inning - 1 + (top ? 0.08 : 0.58) + offset;
}

function emitHalfInning({
  events,
  rng,
  batting,
  pitching,
  battingClub,
  fieldingClub,
  runs,
  inning,
  top,
  hits,
}: {
  events: MatchEvent[];
  rng: RNG;
  batting: Side;
  pitching: Side;
  battingClub: string;
  fieldingClub: string;
  runs: number;
  inning: number;
  top: boolean;
  hits: Record<string, number>;
}) {
  const zone: PitchZone = top ? "left" : "right";
  const fieldZone: PitchZone = top ? "right" : "left";
  for (let i = 0; i < runs; i++) {
    const homer = rng.bool(0.16);
    const batter = pick(rng, homer ? batting.powerHitters : batting.batters);
    if (batter) hits[batter.id] = (hits[batter.id] ?? 0) + 1;
    events.push({
      minute: halfMinute(inning, top, rng.range(0.02, 0.34)),
      type: homer ? "homeRun" : "run",
      clubId: battingClub,
      playerId: batter?.id,
      detail: phrase(rng, homer ? HR : HIT),
      zone,
    });
  }

  const strikeouts = Math.min(2, poisson(rng, 0.9 + pitching.pitchRating / 120));
  for (let i = 0; i < strikeouts; i++) {
    events.push({ minute: halfMinute(inning, top, rng.range(0.02, 0.4)), type: "strikeout", clubId: fieldingClub, playerId: pitching.pitcher?.id, detail: phrase(rng, SO), zone: "mid" });
  }
  if (rng.bool(0.32)) {
    const b = pick(rng, batting.batters);
    events.push({ minute: halfMinute(inning, top, rng.range(0.05, 0.38)), type: "walk", clubId: battingClub, playerId: b?.id, detail: phrase(rng, BB), zone });
  }
  if (rng.bool(0.24)) {
    const b = pick(rng, batting.batters);
    events.push({ minute: halfMinute(inning, top, rng.range(0.05, 0.38)), type: "double", clubId: battingClub, playerId: b?.id, detail: phrase(rng, DOUBLE), zone });
  }
  if (rng.bool(0.08)) events.push({ minute: halfMinute(inning, top, rng.range(0.05, 0.38)), type: "error", clubId: fieldingClub, detail: phrase(rng, ERR), zone: fieldZone });
  if (rng.bool(0.08)) {
    const b = pick(rng, batting.batters);
    events.push({ minute: halfMinute(inning, top, rng.range(0.05, 0.38)), type: "steal", clubId: battingClub, playerId: b?.id, detail: phrase(rng, STEAL), zone: "mid" });
  }
  if (rng.bool(0.09)) events.push({ minute: halfMinute(inning, top, rng.range(0.05, 0.38)), type: "doublePlay", clubId: fieldingClub, detail: phrase(rng, DP), zone: "mid" });
  if (rng.bool(0.28)) {
    const item = EXTRA[rng.int(0, EXTRA.length - 1)];
    const b = pick(rng, batting.batters);
    events.push({ minute: halfMinute(inning, top, rng.range(0.05, 0.38)), type: item.type, clubId: battingClub, playerId: b?.id, detail: phrase(rng, item.detail), zone });
  }
}

// ---------------------------------------------------------------------------
// Segments (resumable matches: a segment is one independently simulatable
// full inning (top + bottom). `simulateMatch` below is a thin composition of
// these, mirroring soccer's segment engine so the Match Center can pause and
// substitute between innings.)
// ---------------------------------------------------------------------------

function segIndex(kind: string): number {
  return parseInt(kind.slice(1), 10);
}

/** Simulate one full inning (top + bottom). Lineups are read fresh, so mid-match substitutions apply from the next inning onward. */
export function simulateSegment(home: MatchTeam, away: MatchTeam, rng: RNG, kind: string, opts: SimOptions = {}): MatchSegmentResult {
  const neutral = opts.neutralVenue ?? false;
  const hs = side(home);
  const as = side(away);
  const homeBat = { ...hs, batRating: hs.batRating + (neutral ? 0 : 1.5) };
  const inning = segIndex(kind);

  const events: MatchEvent[] = [];
  const hits: Record<string, number> = {};

  const awayRuns = poisson(rng, halfInningLambda(as.batRating, hs.pitchRating, false, inning));
  emitHalfInning({ events, rng, batting: as, pitching: hs, battingClub: away.club.id, fieldingClub: home.club.id, runs: awayRuns, inning, top: true, hits });

  const homeRuns = poisson(rng, halfInningLambda(homeBat.batRating, as.pitchRating, true, inning));
  emitHalfInning({ events, rng, batting: homeBat, pitching: as, battingClub: home.club.id, fieldingClub: away.club.id, runs: homeRuns, inning, top: false, hits });

  return {
    events,
    homeGoals: homeRuns,
    awayGoals: awayRuns,
    homeShots: events.filter((e) => e.clubId === home.club.id && (e.type === "run" || e.type === "homeRun" || e.type === "double")).length,
    awayShots: events.filter((e) => e.clubId === away.club.id && (e.type === "run" || e.type === "homeRun" || e.type === "double")).length,
    homeShotsOnTarget: 0,
    awayShotsOnTarget: 0,
    scorerIds: [],
    assistIds: [],
    saves: {},
  };
}

/** The segment a fresh match starts on. */
export function firstSegment(): string {
  return "i1";
}

/** Decide which segment comes after the one just played, given the running score. Baseball never draws, so innings keep extending past 9 until decided. */
export function nextSegment(kind: string, homeScore: number, awayScore: number): string | null {
  const n = segIndex(kind);
  if (n < 9) return `i${n + 1}`;
  return homeScore === awayScore ? `i${n + 1}` : null;
}

/** Merge already-simulated innings into a final MatchResult (ratings, segment scores, decider). */
export function finalizeSegments(
  home: MatchTeam,
  away: MatchTeam,
  segments: { kind: string; result: MatchSegmentResult }[],
  opts: SimOptions,
  rng: RNG,
): MatchResult {
  const hs = side(home);
  const as = side(away);

  let homeScore = 0;
  let awayScore = 0;
  const events: MatchEvent[] = [];
  const hits: Record<string, number> = {};
  const segmentScores: MatchResult["segmentScores"] = [];

  for (const { kind, result } of segments) {
    homeScore += result.homeGoals;
    awayScore += result.awayGoals;
    events.push(...result.events);
    for (const e of result.events) {
      if ((e.type === "run" || e.type === "homeRun") && e.playerId) hits[e.playerId] = (hits[e.playerId] ?? 0) + 1;
    }
    const n = segIndex(kind);
    segmentScores.push({ label: { ko: `${n}회`, en: `${n}` }, homeScore: result.homeGoals, awayScore: result.awayGoals });
  }

  events.sort((a, b) => a.minute - b.minute);

  const playerRatings: Record<string, number> = {};
  const rateBatters = (team: MatchTeam, win: boolean) => {
    for (const p of team.lineup) {
      if (isP(p)) continue;
      const r = 6.3 + (hits[p.id] ?? 0) * 0.55 + (win ? 0.25 : -0.1) + rng.range(-0.3, 0.3);
      playerRatings[p.id] = Math.max(4, Math.min(10, Math.round(r * 10) / 10));
    }
  };
  const ratePitcher = (s: Side, runsAllowed: number, win: boolean) => {
    if (!s.pitcher) return;
    const r = 7.4 - runsAllowed * 0.35 + (win ? 0.3 : 0) + rng.range(-0.2, 0.2);
    playerRatings[s.pitcher.id] = Math.max(4, Math.min(10, Math.round(r * 10) / 10));
  };
  rateBatters(home, homeScore > awayScore);
  rateBatters(away, awayScore > homeScore);
  ratePitcher(hs, awayScore, homeScore > awayScore);
  ratePitcher(as, homeScore, awayScore > homeScore);

  return {
    fixtureId: "",
    homeId: home.club.id,
    awayId: away.club.id,
    homeScore,
    awayScore,
    events,
    playerRatings,
    stats: {
      homePossession: 50,
      homeShots: events.filter((e) => e.clubId === home.club.id && (e.type === "run" || e.type === "homeRun" || e.type === "double")).length,
      awayShots: events.filter((e) => e.clubId === away.club.id && (e.type === "run" || e.type === "homeRun" || e.type === "double")).length,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
    },
    winnerId: homeScore > awayScore ? home.club.id : away.club.id,
    decidedBy: segments.length > 9 ? "extra_time" : "normal",
    segmentScores,
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts: SimOptions = {}): MatchResult {
  const segments: { kind: string; result: MatchSegmentResult }[] = [];
  let homeScore = 0;
  let awayScore = 0;
  let inning = 1;

  while (inning <= 9 || homeScore === awayScore) {
    const kind = `i${inning}`;
    const r = simulateSegment(home, away, rng, kind, opts);
    segments.push({ kind, result: r });
    homeScore += r.homeGoals;
    awayScore += r.awayGoals;
    inning++;
  }

  return finalizeSegments(home, away, segments, opts, rng);
}
