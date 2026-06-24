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

const THREE: Pool2 = [
  { ko: "3점 성공! 림을 가르는 외곽포!", en: "Splash! Drains the three!" },
  { ko: "코너에서 3점! 정확합니다!", en: "Corner three — bullseye!" },
];
const DUNK: Pool2 = [
  { ko: "강력한 덩크! 림이 흔들립니다!", en: "Thunderous slam!" },
  { ko: "앨리웁 덩크 성공!", en: "Alley-oop jam!" },
];
const TWO: Pool2 = [
  { ko: "득점! 미드레인지 점퍼가 들어갑니다.", en: "Buckets — smooth mid-range jumper." },
  { ko: "레이업 성공!", en: "Finishes at the rim." },
];
const FT: Pool2 = [{ ko: "자유투 성공.", en: "Knocks down the free throw." }];
const STEAL: Pool2 = [{ ko: "스틸! 공을 가로챕니다!", en: "Steal! Picks his pocket!" }];
const BLOCK: Pool2 = [{ ko: "블록! 슛을 거부합니다!", en: "Blocked! Sent away!" }];
const TO: Pool2 = [{ ko: "턴오버. 공격권을 넘겨줍니다.", en: "Turnover — coughs it up." }];
const REB: Pool2 = [{ ko: "공격 리바운드 쟁취!", en: "Grabs the offensive board!" }];
const EXTRA: { type: string; detail: Pool2 }[] = [
  { type: "fastBreak", detail: [{ ko: "스틸 이후 속공으로 분위기를 끌어올립니다.", en: "Turns defense into an open-court break." }] },
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
];

function targetPoints(off: number, def: number, home: boolean): number {
  const base = 104 * Math.pow(off / Math.max(30, def), 1.05);
  return Math.max(82, Math.min(138, Math.round(base + (home ? 2.5 : -2.5))));
}

/** Decompose total points into made 3s, 2s and free throws (sums exactly). */
function decompose(total: number, threeSkill: number, rng: RNG): { threes: number; twos: number; fts: number } {
  const threeShare = 0.26 + (threeSkill - 50) / 250 + rng.range(-0.04, 0.04);
  let threes = Math.max(3, Math.round((total * Math.max(0.12, threeShare)) / 3));
  if (threes * 3 > total) threes = Math.floor(total / 3);
  let rem = total - threes * 3;
  let fts = Math.round(rem * 0.18);
  rem -= fts;
  const twos = Math.floor(rem / 2);
  fts += rem - twos * 2; // absorb parity into FTs
  return { threes, twos, fts };
}

export function simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts: SimOptions = {}): MatchResult {
  const neutral = opts.neutralVenue ?? false;
  const hs = side(home);
  const as = side(away);

  let hp = targetPoints(hs.off, as.def, !neutral);
  const ap = targetPoints(as.off, hs.def, false);
  if (hp === ap) hp += rng.bool(hs.off >= as.off ? 0.6 : 0.4) ? 3 : -3; // no ties

  const events: MatchEvent[] = [];
  const pts: Record<string, number> = {};
  const addPts = (id: string | undefined, n: number) => { if (id) pts[id] = (pts[id] ?? 0) + n; };

  function scoreTeam(s: Side, clubId: string, total: number, home: boolean) {
    const zone: PitchZone = home ? "right" : "left";
    const { threes, twos, fts } = decompose(total, s.threeSkill, rng);
    const emit = (type: string, detailPool: Pool2, value: number, withAssist: boolean) => {
      const scorer = pick(rng, s.scorers);
      addPts(scorer?.id, value);
      const assist = withAssist && rng.bool(0.55) ? pick(rng, s.assisters, scorer) : undefined;
      events.push({ minute: rng.int(1, 48), type, clubId, playerId: scorer?.id, assistId: assist?.id, detail: phrase(rng, detailPool), zone });
    };
    for (let i = 0; i < threes; i++) emit("three", THREE, 3, true);
    for (let i = 0; i < twos; i++) {
      const dunk = rng.bool(0.22);
      emit(dunk ? "dunk" : "two", dunk ? DUNK : TWO, 2, true);
    }
    for (let i = 0; i < fts; i++) emit("freeThrow", FT, 1, false);
  }

  scoreTeam(hs, home.club.id, hp, true);
  scoreTeam(as, away.club.id, ap, false);

  // highlights (defensive plays, for flavor + stats)
  function highlights(s: Side, oppId: string, clubId: string, home: boolean) {
    const zone: PitchZone = home ? "right" : "left";
    for (let i = 0; i < Math.min(8, poisson(rng, 7)); i++) {
      const p = pick(rng, s.stealers);
      events.push({ minute: rng.int(1, 48), type: "steal", clubId, playerId: p?.id, detail: phrase(rng, STEAL), zone: "mid" });
    }
    for (let i = 0; i < Math.min(7, poisson(rng, 5)); i++) {
      const p = pick(rng, s.blockers);
      events.push({ minute: rng.int(1, 48), type: "block", clubId, playerId: p?.id, detail: phrase(rng, BLOCK), zone });
    }
    for (let i = 0; i < Math.min(6, poisson(rng, 4)); i++) {
      events.push({ minute: rng.int(1, 48), type: "turnover", clubId: oppId, detail: phrase(rng, TO), zone: "mid" });
    }
    for (let i = 0; i < Math.min(6, poisson(rng, 5)); i++) {
      const p = pick(rng, s.rebounders);
      events.push({ minute: rng.int(1, 48), type: "rebound", clubId, playerId: p?.id, detail: phrase(rng, REB), zone });
    }
  }
  highlights(hs, away.club.id, home.club.id, true);
  highlights(as, home.club.id, away.club.id, false);

  for (let i = 0; i < 18; i++) {
    const homeEvent = rng.bool(0.5);
    const s = homeEvent ? hs : as;
    const clubId = homeEvent ? home.club.id : away.club.id;
    const item = EXTRA[rng.int(0, EXTRA.length - 1)];
    const p = pick(rng, rng.bool(0.5) ? s.scorers : s.assisters);
    events.push({
      minute: rng.int(1, 48),
      type: item.type,
      clubId,
      playerId: p?.id,
      detail: phrase(rng, item.detail),
      zone: homeEvent ? "right" : "left",
    });
  }

  events.sort((a, b) => a.minute - b.minute);

  const playerRatings: Record<string, number> = {};
  const rate = (team: MatchTeam, win: boolean) => {
    for (const p of team.lineup) {
      const r = 6.2 + (pts[p.id] ?? 0) * 0.05 + (win ? 0.3 : -0.1) + rng.range(-0.3, 0.4);
      playerRatings[p.id] = Math.max(4, Math.min(10, Math.round(r * 10) / 10));
    }
  };
  rate(home, hp > ap);
  rate(away, ap > hp);

  return {
    fixtureId: "",
    homeId: home.club.id,
    awayId: away.club.id,
    homeScore: hp,
    awayScore: ap,
    events,
    playerRatings,
    stats: {
      homePossession: 50,
      homeShots: events.filter((e) => e.clubId === home.club.id && ["two", "three", "dunk"].includes(e.type)).length,
      awayShots: events.filter((e) => e.clubId === away.club.id && ["two", "three", "dunk"].includes(e.type)).length,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
    },
    winnerId: hp > ap ? home.club.id : away.club.id,
    decidedBy: "normal",
  };
}
