import type { LocalizedText, MatchEvent, MatchResult, MatchSegmentResult, MatchTeam, PitchZone, SimOptions } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { avgAttr, buildPool, phrase, pick, type Pool } from "../common/simutil";

type Pool2 = LocalizedText[];

interface Side {
  strength: number;
  attackers: Pool;
  finesse: Pool;
  serve: number;
}

function side(team: MatchTeam): Side {
  const l = team.lineup;
  const power = (avgAttr(l, "drive") + avgAttr(l, "volley") + avgAttr(l, "serve")) / 3;
  const touch = (avgAttr(l, "dink") + avgAttr(l, "strategy") + avgAttr(l, "consistency")) / 3;
  const move = (avgAttr(l, "reflexes") + avgAttr(l, "speed") + avgAttr(l, "agility")) / 3;
  return {
    strength: power * 0.42 + touch * 0.33 + move * 0.25,
    serve: avgAttr(l, "serve"),
    attackers: buildPool(l, (p) => 0.4 + ((p.attributes.drive ?? 40) + (p.attributes.volley ?? 40)) / 180),
    finesse: buildPool(l, (p) => 0.4 + ((p.attributes.dink ?? 40) + (p.attributes.strategy ?? 40)) / 180),
  };
}

const WINNER: Pool2 = [{ ko: "위너! 코너를 정확히 찌릅니다.", en: "Winner down the line!" }, { ko: "강한 발리로 마무리합니다.", en: "Puts away the volley!" }];
const ACE: Pool2 = [{ ko: "서브 에이스!", en: "Service ace!" }];
const SMASH: Pool2 = [{ ko: "오버헤드 스매시가 적중합니다.", en: "Overhead smash!" }];
const DINK: Pool2 = [{ ko: "날카로운 딩크 싸움 끝에 득점합니다.", en: "Wins the dink battle!" }];
const FAULT: Pool2 = [{ ko: "폴트. 네트에 걸렸습니다.", en: "Fault into the net." }];
const GAMEWON: Pool2 = [{ ko: "게임을 가져갑니다!", en: "Takes the game!" }];
const EXTRA: { type: string; detail: Pool2 }[] = [
  { type: "thirdShotDrop", detail: [{ ko: "서드샷 드롭으로 키친 싸움에 들어갑니다.", en: "Drops the third shot into the kitchen." }] },
  { type: "kitchenViolation", detail: [{ ko: "논발리존 침범이 선언됩니다.", en: "Kitchen violation is called." }] },
  { type: "erne", detail: [{ ko: "옆라인을 돌아 어니 공격을 시도합니다.", en: "Steps around for an Erne attack." }] },
  { type: "lob", detail: [{ ko: "깊은 롭으로 상대를 뒤로 밀어냅니다.", en: "A deep lob pushes them back." }] },
  { type: "reset", detail: [{ ko: "강한 공을 부드럽게 리셋합니다.", en: "Resets the pace off a hard drive." }] },
  { type: "speedUp", detail: [{ ko: "딩크 랠리 중 갑자기 템포를 올립니다.", en: "Speeds up from the dink exchange." }] },
  { type: "poach", detail: [{ ko: "파트너 앞을 가로질러 포치합니다.", en: "Poaches across the middle." }] },
  { type: "aroundPost", detail: [{ ko: "포스트 바깥으로 돌아가는 샷을 노립니다.", en: "Tries the around-the-post angle." }] },
  { type: "bodyShot", detail: [{ ko: "몸쪽으로 빠른 발리를 붙입니다.", en: "Targets the body with a quick volley." }] },
  { type: "serviceFault", detail: [{ ko: "서브가 짧아 폴트가 됩니다.", en: "The serve lands short." }] },
  { type: "footFault", detail: [{ ko: "서브 동작에서 풋 폴트가 나옵니다.", en: "Foot fault on the serve." }] },
  { type: "timeout", detail: [{ ko: "작전타임으로 흐름을 정리합니다.", en: "Timeout to settle the rhythm." }] },
  { type: "challenge", detail: [{ ko: "라인 판독으로 인/아웃을 확인합니다.", en: "Line challenge checks the call." }] },
  { type: "longRally", detail: [{ ko: "긴 랠리 끝에 집중력이 시험받습니다.", en: "A long rally tests both pairs." }] },
  { type: "dropShotBattle", detail: [{ ko: "드롭샷 공방이 길게 이어집니다.", en: "A long drop-shot battle unfolds." }] },
  { type: "paddleAngle", detail: [{ ko: "패들 각도를 미세하게 조절합니다.", en: "Fine-tunes the paddle angle." }] },
  { type: "nonVolleyLine", detail: [{ ko: "키친 라인까지 바짝 붙어 압박합니다.", en: "Presses right up to the kitchen line." }] },
  { type: "atpAttempt", detail: [{ ko: "포스트 바깥을 돌아가는 공격을 시도합니다.", en: "Attempts a shot around the post." }] },
  { type: "servingDepth", detail: [{ ko: "깊숙한 서브로 리시버를 밀어냅니다.", en: "A deep serve pushes the receiver back." }] },
  { type: "softGame", detail: [{ ko: "소프트 게임으로 템포를 늦춥니다.", en: "Slows it down with the soft game." }] },
  { type: "paddleSwitch", detail: [{ ko: "그립을 바꿔 패들을 다시 잡습니다.", en: "Switches grip on the paddle." }] },
  { type: "stackingFormation", detail: [{ ko: "스태킹 포메이션으로 자리를 바꿉니다.", en: "Shifts into a stacking formation." }] },
  { type: "communicationCall", detail: [{ ko: "파트너에게 콜 사인을 외칩니다.", en: "Calls out to the partner." }] },
  { type: "patientRally", detail: [{ ko: "인내심을 가지고 랠리를 이어갑니다.", en: "Stays patient through the rally." }] },
  { type: "dinkBattle", detail: [{ ko: "날카로운 딩크 싸움이 펼쳐집니다.", en: "A sharp dink battle plays out." }] },
  { type: "forehandRoll", detail: [{ ko: "포핸드 롤샷으로 각을 만듭니다.", en: "Creates an angle with a forehand roll." }] },
  { type: "backhandFlick", detail: [{ ko: "백핸드 플릭으로 빠르게 처리합니다.", en: "Handles it quickly with a backhand flick." }] },
  { type: "courtPositioning", detail: [{ ko: "코트 포지셔닝을 재정비합니다.", en: "Resets court positioning." }] },
  { type: "paddleContact", detail: [{ ko: "정확한 패들 컨택으로 공을 보냅니다.", en: "Clean paddle contact sends it back." }] },
  { type: "switchSides", detail: [{ ko: "좌우 사이드를 스위치합니다.", en: "Switches sides on the court." }] },
  { type: "momentumShift", detail: [{ ko: "분위기가 빠르게 바뀝니다.", en: "The momentum shifts quickly." }] },
  { type: "crowdReaction", detail: [{ ko: "관중석에서 큰 반응이 나옵니다.", en: "The crowd reacts loudly." }] },
  { type: "timeoutStrategy", detail: [{ ko: "작전타임에서 전략을 다시 짭니다.", en: "Reworks the strategy in the timeout." }] },
  { type: "matchPointPressure", detail: [{ ko: "매치포인트 압박감이 무겁게 다가옵니다.", en: "The weight of match point sets in." }] },
];

function rallyWinProb(homeStrength: number, awayStrength: number, serverHome: boolean, homeServe: number, awayServe: number): number {
  const serveEdge = serverHome ? (homeServe - 50) / 500 + 0.04 : -(awayServe - 50) / 500 - 0.04;
  const p = 1 / (1 + Math.exp(-(homeStrength - awayStrength) / 7));
  return Math.max(0.1, Math.min(0.9, p + serveEdge));
}

function gameFinished(homePoints: number, awayPoints: number): boolean {
  return (homePoints >= 11 || awayPoints >= 11) && Math.abs(homePoints - awayPoints) >= 2;
}

function gameMinute(game: number, rally: number): number {
  return game - 1 + Math.min(0.96, rally / 38);
}

// ---------------------------------------------------------------------------
// Segments (resumable matches: a segment is one independently simulatable
// full game. `simulateMatch` below is a thin composition of these, mirroring
// soccer's segment engine so the Match Center can pause and substitute
// between games. Since the final score is games won (not rally points),
// `homeGoals`/`awayGoals` here are 1/0 for the game winner; the actual rally
// point tally is carried in `homeShots`/`awayShots` for display purposes.)
// ---------------------------------------------------------------------------

function gameIndex(kind: string): number {
  return parseInt(kind.slice(1), 10);
}

/** Simulate one full game, rally by rally. Lineups are read fresh, so mid-match substitutions apply from the next game onward. */
export function simulateSegment(home: MatchTeam, away: MatchTeam, rng: RNG, kind: string, opts: SimOptions = {}): MatchSegmentResult {
  const neutral = opts.neutralVenue ?? false;
  const hs = side(home);
  const as = side(away);
  const hStrength = hs.strength + (neutral ? 0 : 1.5);
  const game = gameIndex(kind);

  const events: MatchEvent[] = [];
  let hPts = 0;
  let aPts = 0;
  let rally = 0;
  let serverHome = rng.bool(0.5);

  while (!gameFinished(hPts, aPts)) {
    rally++;
    const homeWinsRally = rng.bool(rallyWinProb(hStrength, as.strength, serverHome, hs.serve, as.serve));
    const servingTeamWon = homeWinsRally === serverHome;
    const winningSide = homeWinsRally ? hs : as;
    const winningClub = homeWinsRally ? home.club.id : away.club.id;
    const losingClub = homeWinsRally ? away.club.id : home.club.id;
    const wz: PitchZone = homeWinsRally ? "right" : "left";
    const lz: PitchZone = homeWinsRally ? "left" : "right";
    const minute = gameMinute(game, rally);

    if (servingTeamWon) {
      if (homeWinsRally) hPts++; else aPts++;
    } else {
      serverHome = homeWinsRally;
      events.push({ minute, type: "sideOut", clubId: winningClub, detail: { ko: "사이드아웃으로 서브권을 가져옵니다.", en: "Side-out earns the serve." }, zone: wz, homePoints: hPts, awayPoints: aPts });
    }

    const roll = rng.next();
    if (roll < 0.18 && serverHome === homeWinsRally) {
      const p = pick(rng, winningSide.attackers);
      events.push({ minute, type: "ace", clubId: winningClub, playerId: p?.id, detail: phrase(rng, ACE), zone: wz, homePoints: hPts, awayPoints: aPts });
    } else if (roll < 0.34) {
      const p = pick(rng, winningSide.attackers);
      events.push({ minute, type: "smash", clubId: winningClub, playerId: p?.id, detail: phrase(rng, SMASH), zone: wz, homePoints: hPts, awayPoints: aPts });
    } else if (roll < 0.5) {
      const p = pick(rng, winningSide.attackers);
      events.push({ minute, type: "winner", clubId: winningClub, playerId: p?.id, detail: phrase(rng, WINNER), zone: wz, homePoints: hPts, awayPoints: aPts });
    } else if (roll < 0.65) {
      const p = pick(rng, winningSide.finesse);
      events.push({ minute, type: "dink", clubId: winningClub, playerId: p?.id, detail: phrase(rng, DINK), zone: wz, homePoints: hPts, awayPoints: aPts });
    } else if (roll < 0.75) {
      events.push({ minute, type: "fault", clubId: losingClub, detail: phrase(rng, FAULT), zone: lz, homePoints: hPts, awayPoints: aPts });
    } else if (roll < 0.9) {
      const item = EXTRA[rng.int(0, EXTRA.length - 1)];
      const p = pick(rng, rng.bool(0.55) ? winningSide.finesse : winningSide.attackers);
      events.push({ minute, type: item.type, clubId: winningClub, playerId: p?.id, detail: phrase(rng, item.detail), zone: wz, homePoints: hPts, awayPoints: aPts });
    }
  }

  const homeWinsGame = hPts > aPts;
  const wClub = homeWinsGame ? home.club.id : away.club.id;
  events.push({
    minute: game,
    type: "gameWon",
    clubId: wClub,
    detail: { ko: `${hPts}-${aPts}. ${phrase(rng, GAMEWON).ko}`, en: `${phrase(rng, GAMEWON).en} ${hPts}-${aPts}` },
    zone: homeWinsGame ? "right" : "left",
    homePoints: hPts,
    awayPoints: aPts,
  });

  return {
    events,
    homeGoals: homeWinsGame ? 1 : 0,
    awayGoals: homeWinsGame ? 0 : 1,
    homeShots: hPts,
    awayShots: aPts,
    homeShotsOnTarget: 0,
    awayShotsOnTarget: 0,
    scorerIds: [],
    assistIds: [],
    saves: {},
  };
}

/** The segment a fresh match starts on. */
export function firstSegment(): string {
  return "g1";
}

/** Decide which segment comes after the one just played. Best-of-three: ends once either side reaches 2 games. */
export function nextSegment(kind: string, homeScore: number, awayScore: number): string | null {
  if (homeScore >= 2 || awayScore >= 2) return null;
  return `g${gameIndex(kind) + 1}`;
}

/** Merge already-simulated games into a final MatchResult (ratings, segment scores, decider). */
export function finalizeSegments(
  home: MatchTeam,
  away: MatchTeam,
  segments: { kind: string; result: MatchSegmentResult }[],
  _opts: SimOptions,
  rng: RNG,
): MatchResult {
  let hG = 0;
  let aG = 0;
  const events: MatchEvent[] = [];
  const points: Record<string, number> = {};
  const bump = (id: string | undefined) => { if (id) points[id] = (points[id] ?? 0) + 1; };
  const segmentScores: MatchResult["segmentScores"] = [];

  for (const { kind, result } of segments) {
    hG += result.homeGoals;
    aG += result.awayGoals;
    events.push(...result.events);
    for (const e of result.events) {
      if (e.type === "ace" || e.type === "smash" || e.type === "winner" || e.type === "dink") bump(e.playerId);
    }
    const n = gameIndex(kind);
    segmentScores.push({ label: { ko: `${n}게임`, en: `Game ${n}` }, homeScore: result.homeShots, awayScore: result.awayShots });
  }

  events.sort((a, b) => a.minute - b.minute);

  const playerRatings: Record<string, number> = {};
  const rate = (team: MatchTeam, win: boolean) => {
    for (const p of team.lineup) {
      const r = 6.4 + (points[p.id] ?? 0) * 0.12 + (win ? 0.5 : -0.3) + rng.range(-0.3, 0.3);
      playerRatings[p.id] = Math.max(4, Math.min(10, Math.round(r * 10) / 10));
    }
  };
  rate(home, hG > aG);
  rate(away, aG > hG);

  return {
    fixtureId: "",
    homeId: home.club.id,
    awayId: away.club.id,
    homeScore: hG,
    awayScore: aG,
    events,
    playerRatings,
    stats: {
      homePossession: 50,
      homeShots: events.filter((e) => e.clubId === home.club.id && ["winner", "smash", "ace"].includes(e.type)).length,
      awayShots: events.filter((e) => e.clubId === away.club.id && ["winner", "smash", "ace"].includes(e.type)).length,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
    },
    winnerId: hG > aG ? home.club.id : away.club.id,
    decidedBy: "normal",
    segmentScores,
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts: SimOptions = {}): MatchResult {
  const segments: { kind: string; result: MatchSegmentResult }[] = [];
  let hG = 0;
  let aG = 0;
  let game = 0;

  while (hG < 2 && aG < 2) {
    game++;
    const kind = `g${game}`;
    const r = simulateSegment(home, away, rng, kind, opts);
    segments.push({ kind, result: r });
    hG += r.homeGoals;
    aG += r.awayGoals;
  }

  return finalizeSegments(home, away, segments, opts, rng);
}
