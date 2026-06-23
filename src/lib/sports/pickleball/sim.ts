import type { LocalizedText, MatchEvent, MatchResult, MatchTeam, PitchZone, SimOptions } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { avgAttr, buildPool, phrase, pick, poisson, type Pool } from "../common/simutil";

type Pool2 = LocalizedText[];

interface Side {
  strength: number;
  attackers: Pool;
  finesse: Pool;
}

function side(team: MatchTeam): Side {
  const l = team.lineup;
  const power = (avgAttr(l, "drive") + avgAttr(l, "volley") + avgAttr(l, "serve")) / 3;
  const touch = (avgAttr(l, "dink") + avgAttr(l, "strategy") + avgAttr(l, "consistency")) / 3;
  const move = (avgAttr(l, "reflexes") + avgAttr(l, "speed") + avgAttr(l, "agility")) / 3;
  return {
    strength: power * 0.42 + touch * 0.33 + move * 0.25,
    attackers: buildPool(l, (p) => 0.4 + ((p.attributes.drive ?? 40) + (p.attributes.volley ?? 40)) / 180),
    finesse: buildPool(l, (p) => 0.4 + ((p.attributes.dink ?? 40) + (p.attributes.strategy ?? 40)) / 180),
  };
}

const WINNER: Pool2 = [{ ko: "위너! 코너를 찌릅니다!", en: "Winner down the line!" }, { ko: "강력한 발리로 마무리!", en: "Puts away the volley!" }];
const ACE: Pool2 = [{ ko: "서브 에이스!", en: "Service ace!" }];
const SMASH: Pool2 = [{ ko: "오버헤드 스매시 작렬!", en: "Overhead smash!" }];
const DINK: Pool2 = [{ ko: "절묘한 딩크 랠리 끝에 득점!", en: "Wins the dink battle!" }];
const FAULT: Pool2 = [{ ko: "범실. 네트에 걸립니다.", en: "Fault — into the net." }];
const GAMEWON: Pool2 = [{ ko: "게임을 가져갑니다!", en: "Takes the game!" }];

function gameWinProb(h: number, a: number): number {
  const p = 1 / (1 + Math.exp(-(h - a) / 7));
  return Math.max(0.15, Math.min(0.85, p));
}

export function simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts: SimOptions = {}): MatchResult {
  const neutral = opts.neutralVenue ?? false;
  const hs = side(home);
  const as = side(away);
  const hAdj = hs.strength + (neutral ? 0 : 1.5);

  const events: MatchEvent[] = [];
  const points: Record<string, number> = {};
  const bump = (id?: string) => { if (id) points[id] = (points[id] ?? 0) + 1; };

  let hG = 0;
  let aG = 0;
  let game = 0;
  while (hG < 2 && aG < 2) {
    game++;
    const homeWins = rng.bool(gameWinProb(hAdj, as.strength));
    const wSide = homeWins ? hs : as;
    const wClub = homeWins ? home.club.id : away.club.id;
    const lClub = homeWins ? away.club.id : home.club.id;
    const wz: PitchZone = homeWins ? "right" : "left";
    const lz: PitchZone = homeWins ? "left" : "right";
    const at = (f: number) => game - 1 + f;

    for (let i = 0; i < Math.min(6, 3 + poisson(rng, 2)); i++) {
      const p = pick(rng, wSide.attackers);
      bump(p?.id);
      const r = rng.next();
      const [type, pool] = r < 0.2 ? ["ace", ACE] : r < 0.4 ? ["smash", SMASH] : ["winner", WINNER];
      events.push({ minute: at(rng.range(0.05, 0.9)), type, clubId: wClub, playerId: p?.id, detail: phrase(rng, pool as Pool2), zone: wz });
    }
    for (let i = 0; i < Math.min(3, poisson(rng, 1.5)); i++) {
      const p = pick(rng, wSide.finesse);
      bump(p?.id);
      events.push({ minute: at(rng.range(0.1, 0.9)), type: "dink", clubId: wClub, playerId: p?.id, detail: phrase(rng, DINK), zone: wz });
    }
    for (let i = 0; i < Math.min(3, poisson(rng, 1.6)); i++) {
      events.push({ minute: at(rng.range(0.1, 0.9)), type: "fault", clubId: lClub, detail: phrase(rng, FAULT), zone: lz });
    }
    events.push({ minute: game, type: "gameWon", clubId: wClub, detail: phrase(rng, GAMEWON), zone: wz });
    if (homeWins) hG++; else aG++;
  }

  events.sort((a, b) => a.minute - b.minute);

  const playerRatings: Record<string, number> = {};
  const rate = (team: MatchTeam, win: boolean) => {
    for (const p of team.lineup) {
      const r = 6.4 + (points[p.id] ?? 0) * 0.22 + (win ? 0.5 : -0.3) + rng.range(-0.3, 0.3);
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
