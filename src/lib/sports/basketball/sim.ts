import type { LocalizedText, MatchEvent, MatchResult, MatchTeam, Player, PitchZone, SimOptions } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { avgAttr, buildPool, phrase, pick, poisson, type Pool } from "../common/simutil";
import { BB_POSITION_GROUP } from "./constants";

type Pool2 = LocalizedText[];

interface Side {
  off: number;
  def: number;
  scorers: Pool;
  assisters: Pool;
  rebounders: Pool;
  stealers: Pool;
  blockers: Pool;
  threeSkill: number;
}

function grp(p: Player): string {
  return BB_POSITION_GROUP[p.positions[0] ?? "SF"] ?? "WING";
}

function side(team: MatchTeam): Side {
  const l = team.lineup;
  const off = (avgAttr(l, "three") + avgAttr(l, "shooting") + avgAttr(l, "finishing") + avgAttr(l, "passing")) / 4;
  const def = (avgAttr(l, "perimeter") + avgAttr(l, "interior") + avgAttr(l, "rebound") + avgAttr(l, "steal") + avgAttr(l, "block")) / 5;
  const scorers = buildPool(l, (p) => (grp(p) === "GUARD" ? 5 : grp(p) === "WING" ? 6 : 4) * (0.4 + ((p.attributes.three ?? 40) + (p.attributes.shooting ?? 40) + (p.attributes.finishing ?? 40)) / 300));
  const assisters = buildPool(l, (p) => (grp(p) === "GUARD" ? 7 : 3) * (0.4 + ((p.attributes.passing ?? 40) + (p.attributes.iq ?? 40)) / 200));
  const rebounders = buildPool(l, (p) => (grp(p) === "BIG" ? 7 : 2) * (0.3 + (p.attributes.rebound ?? 40) / 100));
  const stealers = buildPool(l, (p) => (grp(p) === "GUARD" ? 5 : 3) * (0.3 + (p.attributes.steal ?? 40) / 100));
  const blockers = buildPool(l, (p) => (grp(p) === "BIG" ? 7 : 2) * (0.3 + (p.attributes.block ?? 40) / 100));
  return { off, def, scorers, assisters, rebounders, stealers, blockers, threeSkill: avgAttr(l, "three") };
}

const THREE: Pool2 = [{ ko: "3점슛 성공! 림을 가릅니다.", en: "Splash! Drains the three!" }, { ko: "코너에서 3점이 정확합니다.", en: "Corner three, bullseye!" }];
const DUNK: Pool2 = [{ ko: "강력한 덩크! 림이 흔들립니다.", en: "Thunderous slam!" }, { ko: "앨리웁 덩크 성공!", en: "Alley-oop jam!" }];
const TWO: Pool2 = [{ ko: "야투 성공! 미드레인지 점퍼가 들어갑니다.", en: "Smooth mid-range jumper." }, { ko: "골밑 마무리 성공!", en: "Finishes at the rim." }];
const FT: Pool2 = [{ ko: "자유투를 침착하게 넣습니다.", en: "Knocks down the free throw." }];
const STEAL: Pool2 = [{ ko: "스틸! 공을 가로챕니다.", en: "Steal! Picks his pocket!" }];
const BLOCK: Pool2 = [{ ko: "블록! 슛을 걷어냅니다.", en: "Blocked! Sent away!" }];
const TO: Pool2 = [{ ko: "턴오버. 공격권을 넘겨줍니다.", en: "Turnover, coughs it up." }];
const REB: Pool2 = [{ ko: "리바운드를 따냅니다.", en: "Grabs the board!" }];
const EXTRA: { type: string; detail: Pool2 }[] = [
  { type: "fastBreak", detail: [{ ko: "수비 리바운드 이후 빠르게 속공을 전개합니다.", en: "Turns the rebound into an open-court break." }] },
  { type: "pickAndRoll", detail: [{ ko: "픽앤롤로 수비 스위치를 강요합니다.", en: "Forces a switch with the pick and roll." }] },
  { type: "isolation", detail: [{ ko: "클러치 구간 아이솔레이션을 선택합니다.", en: "Clears out for an isolation." }] },
  { type: "postUp", detail: [{ ko: "로우 포스트에서 미스매치를 공략합니다.", en: "Attacks the mismatch on the block." }] },
  { type: "andOne", detail: [{ ko: "몸싸움을 이겨내며 추가 자유투를 얻습니다.", en: "Absorbs contact and earns the whistle." }] },
  { type: "charge", detail: [{ ko: "정확히 자리를 잡아 공격자 파울을 유도합니다.", en: "Beats the drive and draws a charge." }] },
  { type: "foulTrouble", detail: [{ ko: "주전 선수가 파울 트러블에 걸립니다.", en: "A starter is in foul trouble." }] },
  { type: "timeout", detail: [{ ko: "감독이 작전타임으로 흐름을 끊습니다.", en: "The coach stops the run with a timeout." }] },
  { type: "zoneDefense", detail: [{ ko: "지역방어로 페인트존을 잠급니다.", en: "Drops into a zone to protect the paint." }] },
  { type: "fullCourtPress", detail: [{ ko: "전면 압박으로 볼 운반을 괴롭힙니다.", en: "Picks up full court to speed them up." }] },
  { type: "buzzerBeater", detail: [{ ko: "쿼터 종료 직전 어려운 슛을 던집니다.", en: "Gets a difficult look before the horn." }] },
  { type: "alleyOop", detail: [{ ko: "림 위로 띄운 패스를 마무리합니다.", en: "Finishes the lob above the rim." }] },
  { type: "sixthManRun", detail: [{ ko: "벤치 멤버가 흐름을 바꿉니다.", en: "The sixth man changes the tempo." }] },
  { type: "mismatch", detail: [{ ko: "작은 수비수를 상대로 계속 공략합니다.", en: "Keeps targeting the smaller defender." }] },
  { type: "offBallScreen", detail: [{ ko: "오프볼 스크린으로 슈터를 풀어줍니다.", en: "An off-ball screen frees the shooter." }] },
  { type: "doubleTeam", detail: [{ ko: "더블팀을 붙여 볼을 압박합니다.", en: "Sends a double team to trap the ball." }] },
  { type: "corner3Setup", detail: [{ ko: "코너로 빠르게 볼을 돌려 3점을 세팅합니다.", en: "Swings it to the corner for a three." }] },
  { type: "lobPass", detail: [{ ko: "하이로우 롭 패스를 시도합니다.", en: "Tries a high lob into the post." }] },
  { type: "transitionDefense", detail: [{ ko: "전환 수비로 빠르게 복귀합니다.", en: "Sprints back in transition defense." }] },
  { type: "benchSpark", detail: [{ ko: "벤치에서 들어온 선수가 활력을 더합니다.", en: "A bench player sparks the unit." }] },
  { type: "clutchTime", detail: [{ ko: "승부처에서 침착하게 공격을 풀어갑니다.", en: "Stays composed in clutch time." }] },
  { type: "coachChallenge", detail: [{ ko: "감독이 판정에 챌린지를 신청합니다.", en: "The coach throws the challenge flag." }] },
  { type: "offensiveFoul", detail: [{ ko: "무리한 돌파로 공격자 파울이 선언됩니다.", en: "An offensive foul is called on the drive." }] },
  { type: "boxOut", detail: [{ ko: "박스아웃으로 리바운드 자리를 지킵니다.", en: "Boxes out to secure rebounding position." }] },
  { type: "drivingLane", detail: [{ ko: "드리블로 좁은 드라이브 레인을 뚫습니다.", en: "Drives through a tight driving lane." }] },
  { type: "perimeterDefense", detail: [{ ko: "외곽에서 끈질긴 수비를 펼칩니다.", en: "Plays tenacious perimeter defense." }] },
  { type: "paintProtection", detail: [{ ko: "골밑을 지키며 슛을 방해합니다.", en: "Protects the paint and contests the shot." }] },
  { type: "benchTechnical", detail: [{ ko: "벤치에서 테크니컬 파울이 선언됩니다.", en: "A technical foul is called on the bench." }] },
  { type: "shotClockBeat", detail: [{ ko: "샷클락이 끝나기 직전 슛을 던집니다.", en: "Gets a shot off just before the buzzer." }] },
  { type: "crossoverMove", detail: [{ ko: "날카로운 크로스오버로 수비를 따돌립니다.", en: "A sharp crossover shakes the defender." }] },
  { type: "helpDefense", detail: [{ ko: "헬프 디펜스가 빠르게 도착합니다.", en: "Help defense arrives in time." }] },
  { type: "inboundPlay", detail: [{ ko: "약속된 인바운드 플레이를 가동합니다.", en: "Runs a set inbound play." }] },
  { type: "freeThrowLine", detail: [{ ko: "자유투 라인에서 호흡을 가다듭니다.", en: "Steps to the free-throw line to settle in." }] },
  { type: "benchMomentum", detail: [{ ko: "벤치가 일어나 모멘텀을 더합니다.", en: "The bench rises, fueling the momentum." }] },
];

function targetPoints(off: number, def: number, home: boolean, minutes = 48): number {
  const base = 104 * Math.pow(off / Math.max(30, def), 1.05) * (minutes / 48);
  return Math.max(minutes === 48 ? 82 : 4, Math.min(minutes === 48 ? 138 : 20, Math.round(base + (home ? 2.5 : -2.5))));
}

function splitTotal(total: number, parts: number, rng: RNG): number[] {
  const weights = Array.from({ length: parts }, () => rng.range(0.85, 1.15));
  const sum = weights.reduce((s, w) => s + w, 0);
  const values = weights.map((w) => Math.max(0, Math.floor((total * w) / sum)));
  while (values.reduce((s, v) => s + v, 0) < total) values[rng.int(0, parts - 1)]++;
  return values;
}

function decompose(total: number, threeSkill: number, rng: RNG): { threes: number; twos: number; fts: number } {
  const threeShare = 0.26 + (threeSkill - 50) / 250 + rng.range(-0.04, 0.04);
  let threes = Math.max(0, Math.round((total * Math.max(0.12, threeShare)) / 3));
  if (threes * 3 > total) threes = Math.floor(total / 3);
  let rem = total - threes * 3;
  let fts = Math.round(rem * 0.18);
  rem -= fts;
  const twos = Math.floor(rem / 2);
  fts += rem - twos * 2;
  return { threes, twos, fts };
}

function emitPoints(events: MatchEvent[], rng: RNG, s: Side, clubId: string, total: number, start: number, duration: number, homeSide: boolean, pts: Record<string, number>) {
  const zone: PitchZone = homeSide ? "right" : "left";
  const addPts = (id: string | undefined, n: number) => { if (id) pts[id] = (pts[id] ?? 0) + n; };
  const { threes, twos, fts } = decompose(total, s.threeSkill, rng);
  const emit = (type: string, detailPool: Pool2, value: number, withAssist: boolean) => {
    const scorer = pick(rng, s.scorers);
    addPts(scorer?.id, value);
    const assist = withAssist && rng.bool(0.55) ? pick(rng, s.assisters, scorer) : undefined;
    events.push({ minute: start + rng.range(0.1, duration - 0.1), type, clubId, playerId: scorer?.id, assistId: assist?.id, detail: phrase(rng, detailPool), zone });
  };
  for (let i = 0; i < threes; i++) emit("three", THREE, 3, true);
  for (let i = 0; i < twos; i++) emit(rng.bool(0.22) ? "dunk" : "two", rng.bool(0.22) ? DUNK : TWO, 2, true);
  for (let i = 0; i < fts; i++) emit("freeThrow", FT, 1, false);
}

function emitNonScoring(events: MatchEvent[], rng: RNG, s: Side, clubId: string, oppId: string, start: number, duration: number, homeSide: boolean) {
  const zone: PitchZone = homeSide ? "right" : "left";
  for (let i = 0; i < Math.min(3, poisson(rng, 1.7)); i++) {
    const p = pick(rng, s.stealers);
    events.push({ minute: start + rng.range(0.1, duration - 0.1), type: "steal", clubId, playerId: p?.id, detail: phrase(rng, STEAL), zone: "mid" });
  }
  for (let i = 0; i < Math.min(3, poisson(rng, 1.2)); i++) {
    const p = pick(rng, s.blockers);
    events.push({ minute: start + rng.range(0.1, duration - 0.1), type: "block", clubId, playerId: p?.id, detail: phrase(rng, BLOCK), zone });
  }
  for (let i = 0; i < Math.min(3, poisson(rng, 1.4)); i++) {
    events.push({ minute: start + rng.range(0.1, duration - 0.1), type: "turnover", clubId: oppId, detail: phrase(rng, TO), zone: "mid" });
  }
  for (let i = 0; i < Math.min(3, poisson(rng, 1.6)); i++) {
    const p = pick(rng, s.rebounders);
    events.push({ minute: start + rng.range(0.1, duration - 0.1), type: "rebound", clubId, playerId: p?.id, detail: phrase(rng, REB), zone });
  }
  for (let i = 0; i < 2; i++) {
    const item = EXTRA[rng.int(0, EXTRA.length - 1)];
    const p = pick(rng, rng.bool(0.5) ? s.scorers : s.assisters);
    events.push({ minute: start + rng.range(0.1, duration - 0.1), type: item.type, clubId, playerId: p?.id, detail: phrase(rng, item.detail), zone });
  }
}

export function simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts: SimOptions = {}): MatchResult {
  const neutral = opts.neutralVenue ?? false;
  const hs = side(home);
  const as = side(away);
  const events: MatchEvent[] = [];
  const pts: Record<string, number> = {};
  let decidedBy: MatchResult["decidedBy"] = "normal";

  let homeTotal = targetPoints(hs.off, as.def, !neutral);
  let awayTotal = targetPoints(as.off, hs.def, false);
  const hQuarters = splitTotal(homeTotal, 4, rng);
  const aQuarters = splitTotal(awayTotal, 4, rng);
  const segmentScores: MatchResult["segmentScores"] = [];

  for (let q = 0; q < 4; q++) {
    const start = q * 12;
    emitPoints(events, rng, hs, home.club.id, hQuarters[q], start, 12, true, pts);
    emitPoints(events, rng, as, away.club.id, aQuarters[q], start, 12, false, pts);
    emitNonScoring(events, rng, hs, home.club.id, away.club.id, start, 12, true);
    emitNonScoring(events, rng, as, away.club.id, home.club.id, start, 12, false);
    segmentScores.push({ label: { ko: `${q + 1}쿼터`, en: `Q${q + 1}` }, homeScore: hQuarters[q], awayScore: aQuarters[q] });
  }

  let overtime = 0;
  while (homeTotal === awayTotal) {
    decidedBy = "extra_time";
    overtime++;
    const start = 48 + (overtime - 1) * 5;
    const hOt = targetPoints(hs.off, as.def, false, 5) + rng.int(0, 4);
    const aOt = targetPoints(as.off, hs.def, false, 5) + rng.int(0, 4);
    homeTotal += hOt;
    awayTotal += aOt;
    emitPoints(events, rng, hs, home.club.id, hOt, start, 5, true, pts);
    emitPoints(events, rng, as, away.club.id, aOt, start, 5, false, pts);
    emitNonScoring(events, rng, hs, home.club.id, away.club.id, start, 5, true);
    emitNonScoring(events, rng, as, away.club.id, home.club.id, start, 5, false);
    segmentScores.push({ label: { ko: `연장${overtime > 1 ? overtime : ""}`, en: `OT${overtime > 1 ? overtime : ""}` }, homeScore: hOt, awayScore: aOt });
  }

  events.sort((a, b) => a.minute - b.minute);

  const playerRatings: Record<string, number> = {};
  const rate = (team: MatchTeam, win: boolean) => {
    for (const p of team.lineup) {
      const r = 6.2 + (pts[p.id] ?? 0) * 0.05 + (win ? 0.3 : -0.1) + rng.range(-0.3, 0.4);
      playerRatings[p.id] = Math.max(4, Math.min(10, Math.round(r * 10) / 10));
    }
  };
  rate(home, homeTotal > awayTotal);
  rate(away, awayTotal > homeTotal);

  return {
    fixtureId: "",
    homeId: home.club.id,
    awayId: away.club.id,
    homeScore: homeTotal,
    awayScore: awayTotal,
    events,
    playerRatings,
    stats: {
      homePossession: 50,
      homeShots: events.filter((e) => e.clubId === home.club.id && ["two", "three", "dunk"].includes(e.type)).length,
      awayShots: events.filter((e) => e.clubId === away.club.id && ["two", "three", "dunk"].includes(e.type)).length,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
    },
    winnerId: homeTotal > awayTotal ? home.club.id : away.club.id,
    decidedBy,
    segmentScores,
  };
}
