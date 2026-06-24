import type { LocalizedText, MatchEvent, MatchResult, MatchTeam, PitchZone, SimOptions } from "@/lib/types";
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

export function simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts: SimOptions = {}): MatchResult {
  const neutral = opts.neutralVenue ?? false;
  const hs = side(home);
  const as = side(away);
  const hStrength = hs.strength + (neutral ? 0 : 1.5);

  const events: MatchEvent[] = [];
  const points: Record<string, number> = {};
  const bump = (id?: string) => { if (id) points[id] = (points[id] ?? 0) + 1; };

  let hG = 0;
  let aG = 0;
  let game = 0;
  let serverHome = rng.bool(0.5);

  while (hG < 2 && aG < 2) {
    game++;
    let hPts = 0;
    let aPts = 0;
    let rally = 0;

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
        events.push({ minute, type: "sideOut", clubId: winningClub, detail: { ko: "사이드아웃으로 서브권을 가져옵니다.", en: "Side-out earns the serve." }, zone: wz });
      }

      const roll = rng.next();
      if (roll < 0.18 && serverHome === homeWinsRally) {
        const p = pick(rng, winningSide.attackers);
        bump(p?.id);
        events.push({ minute, type: "ace", clubId: winningClub, playerId: p?.id, detail: phrase(rng, ACE), zone: wz });
      } else if (roll < 0.34) {
        const p = pick(rng, winningSide.attackers);
        bump(p?.id);
        events.push({ minute, type: "smash", clubId: winningClub, playerId: p?.id, detail: phrase(rng, SMASH), zone: wz });
      } else if (roll < 0.5) {
        const p = pick(rng, winningSide.attackers);
        bump(p?.id);
        events.push({ minute, type: "winner", clubId: winningClub, playerId: p?.id, detail: phrase(rng, WINNER), zone: wz });
      } else if (roll < 0.65) {
        const p = pick(rng, winningSide.finesse);
        bump(p?.id);
        events.push({ minute, type: "dink", clubId: winningClub, playerId: p?.id, detail: phrase(rng, DINK), zone: wz });
      } else if (roll < 0.75) {
        events.push({ minute, type: "fault", clubId: losingClub, detail: phrase(rng, FAULT), zone: lz });
      } else if (roll < 0.9) {
        const item = EXTRA[rng.int(0, EXTRA.length - 1)];
        const p = pick(rng, rng.bool(0.55) ? winningSide.finesse : winningSide.attackers);
        events.push({ minute, type: item.type, clubId: winningClub, playerId: p?.id, detail: phrase(rng, item.detail), zone: wz });
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
    });
    if (homeWinsGame) hG++; else aG++;
    serverHome = !serverHome;
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
  };
}
