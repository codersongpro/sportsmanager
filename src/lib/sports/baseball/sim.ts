import type { LocalizedText, MatchEvent, MatchResult, MatchTeam, Player, PitchZone, SimOptions } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { avgAttr, buildPool, phrase, pick, poisson, type Pool } from "../common/simutil";
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

const HIT: Pool2 = [
  { ko: "적시타! 주자가 홈을 밟습니다!", en: "RBI hit! A run scores!" },
  { ko: "중전 안타로 득점!", en: "Base hit brings one home!" },
];
const HR: Pool2 = [
  { ko: "홈런!! 담장을 넘깁니다!", en: "HOME RUN!! Gone!" },
  { ko: "큼지막한 아치! 홈런입니다!", en: "A towering blast — home run!" },
];
const SO: Pool2 = [{ ko: "삼진 아웃! 헛스윙입니다.", en: "Strikeout! Sits him down." }];
const BB: Pool2 = [{ ko: "볼넷으로 출루.", en: "Draws a walk." }];
const DOUBLE: Pool2 = [{ ko: "2루타! 장타가 터집니다.", en: "Rips a double into the gap." }];
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
];

function expectedRuns(bat: number, pitch: number, home: boolean, rng: RNG): number {
  const r = 4.4 * Math.pow(bat / Math.max(28, pitch), 1.25) + (home ? 0.3 : -0.2);
  return Math.max(0, Math.min(16, poisson(rng, Math.max(0.3, r))));
}

export function simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts: SimOptions = {}): MatchResult {
  const neutral = opts.neutralVenue ?? false;
  const hs = side(home);
  const as = side(away);

  let hr = expectedRuns(hs.batRating, as.pitchRating, !neutral, rng);
  let ar = expectedRuns(as.batRating, hs.pitchRating, false, rng);
  while (hr === ar) {
    // extra innings — never a tie
    if (rng.bool(hs.batRating >= as.batRating ? 0.55 : 0.45)) hr += 1;
    else ar += 1;
  }

  const events: MatchEvent[] = [];
  const hits: Record<string, number> = {};

  function scoreTeam(s: Side, clubId: string, runs: number, home: boolean) {
    const zone: PitchZone = home ? "right" : "left";
    for (let i = 0; i < runs; i++) {
      const homer = rng.bool(0.14);
      const batter = pick(rng, homer ? s.powerHitters : s.batters);
      if (batter) hits[batter.id] = (hits[batter.id] ?? 0) + 1;
      events.push({
        minute: rng.int(1, 9),
        type: homer ? "homeRun" : "run",
        clubId,
        playerId: batter?.id,
        detail: phrase(rng, homer ? HR : HIT),
        zone,
      });
    }
  }
  scoreTeam(hs, home.club.id, hr, true);
  scoreTeam(as, away.club.id, ar, false);

  // flavour / non-scoring plays
  function flavour(batSide: Side, pitchSide: Side, batClub: string, fieldClub: string, home: boolean) {
    const zone: PitchZone = home ? "right" : "left";
    for (let i = 0; i < Math.min(11, poisson(rng, 7)); i++) {
      events.push({ minute: rng.int(1, 9), type: "strikeout", clubId: fieldClub, playerId: pitchSide.pitcher?.id, detail: phrase(rng, SO), zone: "mid" });
    }
    for (let i = 0; i < Math.min(5, poisson(rng, 3)); i++) {
      const b = pick(rng, batSide.batters);
      events.push({ minute: rng.int(1, 9), type: "walk", clubId: batClub, playerId: b?.id, detail: phrase(rng, BB), zone });
    }
    for (let i = 0; i < Math.min(4, poisson(rng, 2)); i++) {
      const b = pick(rng, batSide.batters);
      events.push({ minute: rng.int(1, 9), type: "double", clubId: batClub, playerId: b?.id, detail: phrase(rng, DOUBLE), zone });
    }
    if (rng.bool(0.5)) events.push({ minute: rng.int(1, 9), type: "error", clubId: fieldClub, detail: phrase(rng, ERR), zone: "mid" });
    if (rng.bool(0.45)) {
      const b = pick(rng, batSide.batters);
      events.push({ minute: rng.int(1, 9), type: "steal", clubId: batClub, playerId: b?.id, detail: phrase(rng, STEAL), zone: "mid" });
    }
    if (rng.bool(0.4)) events.push({ minute: rng.int(1, 9), type: "doublePlay", clubId: fieldClub, detail: phrase(rng, DP), zone: "mid" });
  }
  flavour(hs, as, home.club.id, away.club.id, true);
  flavour(as, hs, away.club.id, home.club.id, false);

  for (let i = 0; i < 16; i++) {
    const homeEvent = rng.bool(0.5);
    const batSide = homeEvent ? hs : as;
    const clubId = homeEvent ? home.club.id : away.club.id;
    const item = EXTRA[rng.int(0, EXTRA.length - 1)];
    const b = pick(rng, batSide.batters);
    events.push({
      minute: rng.int(1, 9),
      type: item.type,
      clubId,
      playerId: b?.id,
      detail: phrase(rng, item.detail),
      zone: homeEvent ? "right" : "left",
    });
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
  rateBatters(home, hr > ar);
  rateBatters(away, ar > hr);
  ratePitcher(hs, ar, hr > ar);
  ratePitcher(as, hr, ar > hr);

  return {
    fixtureId: "",
    homeId: home.club.id,
    awayId: away.club.id,
    homeScore: hr,
    awayScore: ar,
    events,
    playerRatings,
    stats: {
      homePossession: 50,
      homeShots: events.filter((e) => e.clubId === home.club.id && (e.type === "run" || e.type === "homeRun" || e.type === "double")).length,
      awayShots: events.filter((e) => e.clubId === away.club.id && (e.type === "run" || e.type === "homeRun" || e.type === "double")).length,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
    },
    winnerId: hr > ar ? home.club.id : away.club.id,
    decidedBy: "normal",
  };
}
