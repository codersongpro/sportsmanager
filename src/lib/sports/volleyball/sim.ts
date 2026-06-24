import type { LocalizedText, MatchEvent, MatchResult, MatchTeam, Player, PitchZone, SimOptions } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { avgAttr, buildPool, phrase, pick, type Pool } from "../common/simutil";
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

const SPIKE: Pool2 = [{ ko: "강력한 스파이크 득점!", en: "Hammered down for the point!" }, { ko: "대각 스파이크가 코트를 가릅니다.", en: "Cross-court kill!" }];
const ACE: Pool2 = [{ ko: "서브 에이스!", en: "Service ace!" }];
const BLOCK: Pool2 = [{ ko: "블로킹 성공! 상대 공격을 막아냅니다.", en: "Stuff block at the net!" }];
const DIG: Pool2 = [{ ko: "놀라운 디그로 랠리를 살립니다.", en: "Incredible dig keeps it alive!" }];
const ERR: Pool2 = [{ ko: "범실. 공격이 라인을 벗어납니다.", en: "Unforced error, hit out." }];
const SETWON: Pool2 = [{ ko: "세트를 가져갑니다!", en: "Takes the set!" }];
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

export function simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts: SimOptions = {}): MatchResult {
  const neutral = opts.neutralVenue ?? false;
  const hs = side(home);
  const as = side(away);
  const hStrength = hs.strength + (neutral ? 0 : 2);

  const events: MatchEvent[] = [];
  const points: Record<string, number> = {};
  const bump = (id: string | undefined) => { if (id) points[id] = (points[id] ?? 0) + 1; };

  let hSets = 0;
  let aSets = 0;
  let setNumber = 0;
  let serverHome = rng.bool(0.5);

  while (hSets < 3 && aSets < 3) {
    setNumber++;
    const target = setTarget(setNumber);
    let hPoints = 0;
    let aPoints = 0;
    let rally = 0;

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
        bump(p?.id);
        events.push({ minute, type: "spike", clubId: winningClub, playerId: p?.id, detail: phrase(rng, SPIKE), zone: wz });
      } else if (roll < 0.38) {
        const p = pick(rng, winningSide.servers);
        bump(p?.id);
        events.push({ minute, type: "ace", clubId: winningClub, playerId: p?.id, detail: phrase(rng, ACE), zone: wz });
      } else if (roll < 0.5) {
        const p = pick(rng, winningSide.blockers);
        bump(p?.id);
        events.push({ minute, type: "block", clubId: winningClub, playerId: p?.id, detail: phrase(rng, BLOCK), zone: wz });
      } else if (roll < 0.6) {
        const p = pick(rng, losingSide.diggers);
        events.push({ minute, type: "dig", clubId: losingClub, playerId: p?.id, detail: phrase(rng, DIG), zone: lz });
      } else if (roll < 0.68) {
        events.push({ minute, type: "error", clubId: losingClub, detail: phrase(rng, ERR), zone: lz });
      } else if (roll < 0.82) {
        const item = EXTRA[rng.int(0, EXTRA.length - 1)];
        const p = pick(rng, rng.bool(0.5) ? winningSide.spikers : winningSide.servers);
        events.push({ minute, type: item.type, clubId: winningClub, playerId: p?.id, detail: phrase(rng, item.detail), zone: wz });
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
    });
    if (homeWonSet) hSets++; else aSets++;
    serverHome = !serverHome;
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
  };
}
