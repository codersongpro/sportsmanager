import type { LocalizedText, MatchEvent, MatchResult, MatchTeam, Player, PitchZone, SimOptions } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { avgAttr, buildPool, phrase, pick, poisson, type Pool } from "../common/simutil";
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
    strength: attack * 0.58 + def * 0.42,
    spikers: buildPool(l, (p) => (grp(p) === "ATT" ? 6 : grp(p) === "BLK" ? 4 : 1) * (0.4 + (p.attributes.spike ?? 40) / 90)),
    servers: buildPool(l, (p) => 0.4 + (p.attributes.serve ?? 40) / 80),
    blockers: buildPool(l, (p) => (grp(p) === "BLK" ? 6 : grp(p) === "ATT" ? 3 : 1) * (0.4 + (p.attributes.block ?? 40) / 90)),
    diggers: buildPool(l, (p) => (grp(p) === "LIB" ? 6 : 2) * (0.4 + (p.attributes.dig ?? 40) / 90)),
  };
}

const SPIKE: Pool2 = [{ ko: "강력한 스파이크 득점!", en: "Hammered down for the point!" }, { ko: "대각 스파이크가 꽂힙니다!", en: "Cross-court kill!" }];
const ACE: Pool2 = [{ ko: "서브 에이스!", en: "Service ace!" }];
const BLOCK: Pool2 = [{ ko: "블로킹 성공! 상대 공격을 막아냅니다!", en: "Stuff block at the net!" }];
const DIG: Pool2 = [{ ko: "환상적인 디그!", en: "Incredible dig keeps it alive!" }];
const ERR: Pool2 = [{ ko: "범실. 공격이 아웃됩니다.", en: "Unforced error — hits it out." }];
const SETWON: Pool2 = [{ ko: "세트를 가져갑니다!", en: "Takes the set!" }];

function setWinProb(h: number, a: number): number {
  const p = 1 / (1 + Math.exp(-(h - a) / 8));
  return Math.max(0.15, Math.min(0.85, p));
}

export function simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts: SimOptions = {}): MatchResult {
  const neutral = opts.neutralVenue ?? false;
  const hs = side(home);
  const as = side(away);
  const hAdj = hs.strength + (neutral ? 0 : 2);

  const events: MatchEvent[] = [];
  const points: Record<string, number> = {};
  const bump = (id: string | undefined) => { if (id) points[id] = (points[id] ?? 0) + 1; };

  let hSets = 0;
  let aSets = 0;
  let set = 0;
  while (hSets < 3 && aSets < 3) {
    set++;
    const homeWins = rng.bool(setWinProb(hAdj, as.strength));
    const wSide = homeWins ? hs : as;
    const wClub = homeWins ? home.club.id : away.club.id;
    const lSide = homeWins ? as : hs;
    const lClub = homeWins ? away.club.id : home.club.id;
    const wz: PitchZone = homeWins ? "right" : "left";
    const lz: PitchZone = homeWins ? "left" : "right";
    const at = (frac: number) => set - 1 + frac;

    // rally highlights for the set (winner gets a few more)
    const spikes = (s: Side, club: string, z: PitchZone, n: number) => {
      for (let i = 0; i < n; i++) {
        const p = pick(rng, s.spikers);
        bump(p?.id);
        events.push({ minute: at(rng.range(0.05, 0.9)), type: "spike", clubId: club, playerId: p?.id, detail: phrase(rng, SPIKE), zone: z });
      }
    };
    spikes(wSide, wClub, wz, Math.min(7, 4 + poisson(rng, 2)));
    spikes(lSide, lClub, lz, Math.min(5, 2 + poisson(rng, 1)));
    for (let i = 0; i < Math.min(3, poisson(rng, 1.4)); i++) {
      const p = pick(rng, wSide.servers);
      bump(p?.id);
      events.push({ minute: at(rng.range(0.1, 0.9)), type: "ace", clubId: wClub, playerId: p?.id, detail: phrase(rng, ACE), zone: wz });
    }
    for (let i = 0; i < Math.min(3, poisson(rng, 1.5)); i++) {
      const p = pick(rng, wSide.blockers);
      bump(p?.id);
      events.push({ minute: at(rng.range(0.1, 0.9)), type: "block", clubId: wClub, playerId: p?.id, detail: phrase(rng, BLOCK), zone: wz });
    }
    for (let i = 0; i < Math.min(3, poisson(rng, 1.4)); i++) {
      const p = pick(rng, lSide.diggers);
      events.push({ minute: at(rng.range(0.1, 0.9)), type: "dig", clubId: lClub, playerId: p?.id, detail: phrase(rng, DIG), zone: lz });
    }
    if (rng.bool(0.6)) events.push({ minute: at(rng.range(0.2, 0.9)), type: "error", clubId: lClub, detail: phrase(rng, ERR), zone: lz });

    events.push({ minute: set, type: "setWon", clubId: wClub, detail: phrase(rng, SETWON), zone: wz });
    if (homeWins) hSets++; else aSets++;
  }

  events.sort((a, b) => a.minute - b.minute);

  const playerRatings: Record<string, number> = {};
  const rate = (team: MatchTeam, win: boolean) => {
    for (const p of team.lineup) {
      const r = 6.3 + (points[p.id] ?? 0) * 0.18 + (win ? 0.4 : -0.2) + rng.range(-0.3, 0.3);
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
      homeShots: events.filter((e) => e.clubId === home.club.id && e.type === "spike").length,
      awayShots: events.filter((e) => e.clubId === away.club.id && e.type === "spike").length,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
    },
    winnerId: hSets > aSets ? home.club.id : away.club.id,
    decidedBy: "normal",
  };
}
