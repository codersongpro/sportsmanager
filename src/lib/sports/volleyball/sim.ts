import type { LocalizedText, MatchEvent, MatchResult, MatchSegmentResult, MatchTeam, Player, PitchZone, SimOptions } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { avgAttr, buildPool, lineupDevelopment, phrase, pick, type Pool } from "../common/simutil";
import { VB_POSITION_GROUP } from "./constants";

type Pool2 = LocalizedText[];

interface Side {
  strength: number;
  spikers: Pool;
  servers: Pool;
  blockers: Pool;
  diggers: Pool;
}

function grp(p: Player): string {
  return VB_POSITION_GROUP[p.positions[0] ?? "OH"] ?? "ATT";
}

function side(team: MatchTeam): Side {
  const l = team.lineup;
  const attack = avgAttr(l, "spike") * 0.6 + avgAttr(l, "serve") * 0.25 + avgAttr(l, "setting") * 0.15;
  const def = (avgAttr(l, "block") + avgAttr(l, "dig") + avgAttr(l, "receive")) / 3;
  return {
    strength: (attack * 0.58 + def * 0.42) * lineupDevelopment(l),
    spikers: buildPool(l, (p) => (grp(p) === "ATT" ? 6 : grp(p) === "BLK" ? 4 : 1) * (0.4 + (p.attributes.spike ?? 40) / 90)),
    servers: buildPool(l, (p) => 0.4 + (p.attributes.serve ?? 40) / 80),
    blockers: buildPool(l, (p) => (grp(p) === "BLK" ? 6 : grp(p) === "ATT" ? 3 : 1) * (0.4 + (p.attributes.block ?? 40) / 90)),
    diggers: buildPool(l, (p) => (grp(p) === "LIB" ? 6 : 2) * (0.4 + (p.attributes.dig ?? 40) / 90)),
  };
}

const SPIKE: Pool2 = [{ ko: "강력한 스파이크 득점!", en: "Hammered down for the point!" }, { ko: "대각 스파이크가 코트를 가릅니다.", en: "Cross-court kill!" }];
const ACE: Pool2 = [
  { ko: "서브 에이스!", en: "Service ace!" },
  { ko: "서브 에이스! 리시브가 전혀 닿지 않습니다!", en: "Service ace! Drops untouched!" },
  { ko: "강렬한 서브가 그대로 점수로 연결됩니다!", en: "A blistering serve, straight to the floor!" },
];
const BLOCK: Pool2 = [
  { ko: "블로킹 성공! 상대 공격을 막아냅니다.", en: "Stuff block at the net!" },
  { ko: "블로킹 성공! 상대 스파이크를 그대로 돌려보냅니다!", en: "Stuff block! Sends it right back down!" },
  { ko: "더블 블로킹으로 완벽하게 차단합니다!", en: "A perfect double block shuts it down!" },
];
const DIG: Pool2 = [
  { ko: "놀라운 디그로 랠리를 살립니다.", en: "Incredible dig keeps it alive!" },
  { ko: "몸을 던진 디그로 공을 살려냅니다!", en: "A diving dig keeps the rally going!" },
  { ko: "강한 스파이크를 디그로 받아냅니다!", en: "Digs out a thunderous spike!" },
];
const ERR: Pool2 = [
  { ko: "범실. 공격이 라인을 벗어납니다.", en: "Unforced error, hit out." },
  { ko: "범실. 공격이 네트에 걸립니다.", en: "Unforced error, into the net." },
  { ko: "범실. 리시브가 흐트러집니다.", en: "Unforced error, the reception breaks down." },
];
const SETWON: Pool2 = [
  { ko: "세트를 가져갑니다!", en: "Takes the set!" },
  { ko: "끈질긴 접전 끝에 세트를 따냅니다!", en: "Grinds out a hard-fought set!" },
  { ko: "결정적인 한 점으로 세트를 마무리합니다!", en: "A clutch point seals the set!" },
];
const EXTRA: { type: string; detail: Pool2 }[] = [
  { type: "quickAttack", detail: [{ ko: "세터가 중앙 속공을 빠르게 엽니다.", en: "The setter opens a quick middle attack." }] },
  { type: "pipeAttack", detail: [{ ko: "후위 파이프 공격으로 블로커를 흔듭니다.", en: "A back-row pipe attack splits the block." }] },
  { type: "tip", detail: [{ ko: "강타 대신 연타로 빈 곳을 찌릅니다.", en: "A soft tip drops into space." }] },
  { type: "receiveAce", detail: [{ ko: "강서브에 리시브 라인이 흔들립니다.", en: "The serve knocks the receive line out of shape." }] },
  { type: "setterDump", detail: [{ ko: "세터가 기습 페인트로 허를 찌릅니다.", en: "The setter dumps on the second touch." }] },
  { type: "doubleContact", detail: [{ ko: "토스 과정에서 더블 컨택이 선언됩니다.", en: "Double contact is called on the set." }] },
  { type: "netTouch", detail: [{ ko: "네트 터치로 랠리가 끊깁니다.", en: "A net touch stops the rally." }] },
  { type: "rotationFault", detail: [{ ko: "로테이션 위치가 어긋났습니다.", en: "The rotation is out of order." }] },
  { type: "challenge", detail: [{ ko: "벤치가 비디오 판독을 요청합니다.", en: "The bench asks for a video challenge." }] },
  { type: "timeout", detail: [{ ko: "감독이 작전타임으로 서브 흐름을 끊습니다.", en: "The coach calls timeout to stop the serve run." }] },
  { type: "substitution", detail: [{ ko: "원포인트 서버가 투입됩니다.", en: "A serving specialist checks in." }] },
  { type: "serveRun", detail: [{ ko: "연속 서브로 점수 차를 벌립니다.", en: "A serve run stretches the lead." }] },
  { type: "joust", detail: [{ ko: "네트 위에서 공을 두고 힘겨루기가 벌어집니다.", en: "Both sides joust above the net." }] },
  { type: "pancake", detail: [{ ko: "손등을 깔아 극적인 디그를 성공합니다.", en: "A pancake save keeps the rally alive." }] },
  { type: "overpass", detail: [{ ko: "리시브가 길어져 바로 공격 기회를 줍니다.", en: "An overpass gifts a free swing." }] },
  { type: "floatServe", detail: [{ ko: "플로터 서브로 리시브 타이밍을 흔듭니다.", en: "A floating serve disrupts the timing." }] },
  { type: "jumpServe", detail: [{ ko: "강력한 점프 서브가 날아갑니다.", en: "Unleashes a powerful jump serve." }] },
  { type: "transitionAttack", detail: [{ ko: "수비 후 빠른 전환 공격으로 이어갑니다.", en: "Transitions quickly into the attack." }] },
  { type: "backRowDefense", detail: [{ ko: "후위 수비가 끈질기게 버텨냅니다.", en: "The back row defense holds firm." }] },
  { type: "setterDecision", detail: [{ ko: "세터가 절묘한 토스 위치를 선택합니다.", en: "The setter picks out a smart target." }] },
  { type: "middleBlock", detail: [{ ko: "미들 블로커가 타이밍을 맞춰 점프합니다.", en: "The middle blocker times the jump perfectly." }] },
  { type: "liberoDig", detail: [{ ko: "리베로가 몸을 던져 공을 살립니다.", en: "The libero dives to keep it alive." }] },
  { type: "servingRotation", detail: [{ ko: "로테이션이 돌며 서브 순서가 바뀝니다.", en: "The rotation turns over the serving order." }] },
  { type: "crossCourtShot", detail: [{ ko: "대각선으로 강하게 찔러 넣습니다.", en: "Drills it cross-court." }] },
  { type: "lineShot", detail: [{ ko: "라인을 타고 떨어지는 공격이 나옵니다.", en: "Paints the line with a sharp shot." }] },
  { type: "blockTouch", detail: [{ ko: "블로킹 터치 이후 공이 살아납니다.", en: "A block touch keeps the rally alive." }] },
  { type: "coachInstruction", detail: [{ ko: "감독이 사이드라인에서 지시를 내립니다.", en: "The coach signals instructions from the sideline." }] },
  { type: "servePressure", detail: [{ ko: "압박감 있는 서브가 이어집니다.", en: "Keeps serving with relentless pressure." }] },
  { type: "freeBall", detail: [{ ko: "프리볼 상황에서 공격을 준비합니다.", en: "Sets up the attack off a free ball." }] },
  { type: "coveringHitter", detail: [{ ko: "동료들이 공격수를 커버합니다.", en: "Teammates cover the hitter." }] },
  { type: "outOfSystem", detail: [{ ko: "시스템이 무너진 상황에서도 침착하게 처리합니다.", en: "Handles the out-of-system play calmly." }] },
  { type: "blockingScheme", detail: [{ ko: "블로킹 전략을 다시 조정합니다.", en: "Adjusts the blocking scheme." }] },
  { type: "servingSpecialist", detail: [{ ko: "서브 전문 요원이 코트에 들어섭니다.", en: "A serving specialist checks into the court." }] },
  { type: "momentumSwing", detail: [{ ko: "분위기가 순식간에 뒤바뀝니다.", en: "The momentum suddenly swings." }] },
  { type: "matchPointTension", detail: [{ ko: "매치포인트 상황에서 긴장감이 감돕니다.", en: "Tension rises at match point." }] },
];

function setWinProb(homeStrength: number, awayStrength: number, serverHome: boolean): number {
  const p = 1 / (1 + Math.exp(-(homeStrength - awayStrength) / 8));
  return Math.max(0.12, Math.min(0.88, p + (serverHome ? 0.025 : -0.025)));
}

function setTarget(setNumber: number): number {
  return setNumber >= 5 ? 15 : 25;
}

function setFinished(homePoints: number, awayPoints: number, target: number): boolean {
  return (homePoints >= target || awayPoints >= target) && Math.abs(homePoints - awayPoints) >= 2;
}

function rallyMinute(setNumber: number, rally: number): number {
  return setNumber - 1 + Math.min(0.96, rally / 55);
}

// ---------------------------------------------------------------------------
// Segments (resumable matches: a segment is one independently simulatable
// full set. `simulateMatch` below is a thin composition of these, mirroring
// soccer's segment engine so the Match Center can pause and substitute
// between sets. Since the final score is sets won (not rally points),
// `homeGoals`/`awayGoals` here are 1/0 for the set winner; the actual rally
// point tally is carried in `homeShots`/`awayShots` for display purposes.)
// ---------------------------------------------------------------------------

function setIndex(kind: string): number {
  return parseInt(kind.slice(1), 10);
}

/** Simulate one full set, rally by rally. Lineups are read fresh, so mid-match substitutions apply from the next set onward. */
export function simulateSegment(home: MatchTeam, away: MatchTeam, rng: RNG, kind: string, opts: SimOptions = {}): MatchSegmentResult {
  const neutral = opts.neutralVenue ?? false;
  const hs = side(home);
  const as = side(away);
  // Per-set "clutch" swing (constant within the set): some sets one side just
  // turns up, so a tight match can flip the underdog's way. Drawn from the rng.
  const clutch = rng.gaussian(0, 2.5);
  const hStrength = hs.strength + (neutral ? 0 : 2) + clutch;
  const setNumber = setIndex(kind);
  const target = setTarget(setNumber);

  const events: MatchEvent[] = [];
  let hPoints = 0;
  let aPoints = 0;
  let rally = 0;
  let serverHome = rng.bool(0.5);

  while (!setFinished(hPoints, aPoints, target)) {
    rally++;
    const homeWinsRally = rng.bool(setWinProb(hStrength, as.strength, serverHome));
    const winningSide = homeWinsRally ? hs : as;
    const losingSide = homeWinsRally ? as : hs;
    const winningClub = homeWinsRally ? home.club.id : away.club.id;
    const losingClub = homeWinsRally ? away.club.id : home.club.id;
    const wz: PitchZone = homeWinsRally ? "right" : "left";
    const lz: PitchZone = homeWinsRally ? "left" : "right";
    const minute = rallyMinute(setNumber, rally);

    if (homeWinsRally) hPoints++; else aPoints++;
    serverHome = homeWinsRally;

    const roll = rng.next();
    if (roll < 0.28) {
      const p = pick(rng, winningSide.spikers);
      events.push({ minute, type: "spike", clubId: winningClub, playerId: p?.id, detail: phrase(rng, SPIKE), zone: wz, homePoints: hPoints, awayPoints: aPoints });
    } else if (roll < 0.38) {
      const p = pick(rng, winningSide.servers);
      events.push({ minute, type: "ace", clubId: winningClub, playerId: p?.id, detail: phrase(rng, ACE), zone: wz, homePoints: hPoints, awayPoints: aPoints });
    } else if (roll < 0.5) {
      const p = pick(rng, winningSide.blockers);
      events.push({ minute, type: "block", clubId: winningClub, playerId: p?.id, detail: phrase(rng, BLOCK), zone: wz, homePoints: hPoints, awayPoints: aPoints });
    } else if (roll < 0.6) {
      const p = pick(rng, losingSide.diggers);
      events.push({ minute, type: "dig", clubId: losingClub, playerId: p?.id, detail: phrase(rng, DIG), zone: lz, homePoints: hPoints, awayPoints: aPoints });
    } else if (roll < 0.68) {
      events.push({ minute, type: "error", clubId: losingClub, detail: phrase(rng, ERR), zone: lz, homePoints: hPoints, awayPoints: aPoints });
    } else if (roll < 0.82) {
      const item = EXTRA[rng.int(0, EXTRA.length - 1)];
      const p = pick(rng, rng.bool(0.5) ? winningSide.spikers : winningSide.servers);
      events.push({ minute, type: item.type, clubId: winningClub, playerId: p?.id, detail: phrase(rng, item.detail), zone: wz, homePoints: hPoints, awayPoints: aPoints });
    }
  }

  const homeWonSet = hPoints > aPoints;
  const setClub = homeWonSet ? home.club.id : away.club.id;
  events.push({
    minute: setNumber,
    type: "setWon",
    clubId: setClub,
    detail: { ko: `${hPoints}-${aPoints}. ${phrase(rng, SETWON).ko}`, en: `${phrase(rng, SETWON).en} ${hPoints}-${aPoints}` },
    zone: homeWonSet ? "right" : "left",
    homePoints: hPoints,
    awayPoints: aPoints,
  });

  return {
    events,
    homeGoals: homeWonSet ? 1 : 0,
    awayGoals: homeWonSet ? 0 : 1,
    homeShots: hPoints,
    awayShots: aPoints,
    homeShotsOnTarget: 0,
    awayShotsOnTarget: 0,
    scorerIds: [],
    assistIds: [],
    saves: {},
  };
}

/** The segment a fresh match starts on. */
export function firstSegment(): string {
  return "s1";
}

/** Decide which segment comes after the one just played. Best-of-five: ends once either side reaches 3 sets. */
export function nextSegment(kind: string, homeScore: number, awayScore: number): string | null {
  if (homeScore >= 3 || awayScore >= 3) return null;
  return `s${setIndex(kind) + 1}`;
}

/** Merge already-simulated sets into a final MatchResult (ratings, segment scores, decider). */
export function finalizeSegments(
  home: MatchTeam,
  away: MatchTeam,
  segments: { kind: string; result: MatchSegmentResult }[],
  _opts: SimOptions,
  rng: RNG,
): MatchResult {
  let hSets = 0;
  let aSets = 0;
  const events: MatchEvent[] = [];
  const points: Record<string, number> = {};
  const bump = (id: string | undefined) => { if (id) points[id] = (points[id] ?? 0) + 1; };
  const segmentScores: MatchResult["segmentScores"] = [];

  for (const { kind, result } of segments) {
    hSets += result.homeGoals;
    aSets += result.awayGoals;
    events.push(...result.events);
    for (const e of result.events) {
      if (e.type === "spike" || e.type === "ace" || e.type === "block") bump(e.playerId);
    }
    const n = setIndex(kind);
    segmentScores.push({ label: { ko: `${n}세트`, en: `Set ${n}` }, homeScore: result.homeShots, awayScore: result.awayShots });
  }

  events.sort((a, b) => a.minute - b.minute);

  const playerRatings: Record<string, number> = {};
  const rate = (team: MatchTeam, win: boolean) => {
    for (const p of team.lineup) {
      const r = 6.3 + (points[p.id] ?? 0) * 0.08 + (win ? 0.4 : -0.2) + rng.range(-0.3, 0.3);
      playerRatings[p.id] = Math.max(4, Math.min(10, Math.round(r * 10) / 10));
    }
  };
  rate(home, hSets > aSets);
  rate(away, aSets > hSets);

  return {
    fixtureId: "",
    homeId: home.club.id,
    awayId: away.club.id,
    homeScore: hSets,
    awayScore: aSets,
    events,
    playerRatings,
    stats: {
      homePossession: 50,
      homeShots: events.filter((e) => e.clubId === home.club.id && ["spike", "quickAttack", "pipeAttack"].includes(e.type)).length,
      awayShots: events.filter((e) => e.clubId === away.club.id && ["spike", "quickAttack", "pipeAttack"].includes(e.type)).length,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
    },
    winnerId: hSets > aSets ? home.club.id : away.club.id,
    decidedBy: "normal",
    segmentScores,
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts: SimOptions = {}): MatchResult {
  const segments: { kind: string; result: MatchSegmentResult }[] = [];
  let hSets = 0;
  let aSets = 0;
  let setNumber = 0;

  while (hSets < 3 && aSets < 3) {
    setNumber++;
    const kind = `s${setNumber}`;
    const r = simulateSegment(home, away, rng, kind, opts);
    segments.push({ kind, result: r });
    hSets += r.homeGoals;
    aSets += r.awayGoals;
  }

  return finalizeSegments(home, away, segments, opts, rng);
}
