import type {
  LocalizedText,
  MatchEvent,
  MatchResult,
  MatchTeam,
  PitchZone,
  Player,
  SimOptions,
} from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { POSITION_GROUP } from "./constants";
import { calcOverall } from "./ratings";

// ---------------------------------------------------------------------------
// Team strength model (drives results from real player attributes)
// ---------------------------------------------------------------------------

interface Pool {
  players: Player[];
  weights: number[];
}

interface TeamPower {
  gk: number;
  gkPlayer?: Player;
  attackPower: number;
  defPower: number;
  scorers: Pool;
  assisters: Pool;
  foulers: Pool;
  pacey: Pool;
  crossers: Pool;
  aggression: number;
}

function poisson(rng: RNG, lambda: number): number {
  const L = Math.exp(-Math.max(0, lambda));
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng.next();
  } while (p > L);
  return k - 1;
}

function mentalityAtt(m: MatchTeam): number {
  return m.club.tactics.mentality === "attacking" ? 1.12 : m.club.tactics.mentality === "defensive" ? 0.9 : 1;
}
function mentalityDef(m: MatchTeam): number {
  return m.club.tactics.mentality === "attacking" ? 0.92 : m.club.tactics.mentality === "defensive" ? 1.12 : 1;
}

function teamPower(team: MatchTeam): TeamPower {
  let gk = 42;
  let gkPlayer: Player | undefined;
  let defSum = 0,
    defN = 0,
    midSum = 0,
    midN = 0,
    fwdSum = 0,
    fwdN = 0,
    aggrSum = 0;

  const scorers: Pool = { players: [], weights: [] };
  const assisters: Pool = { players: [], weights: [] };
  const foulers: Pool = { players: [], weights: [] };
  const pacey: Pool = { players: [], weights: [] };
  const crossers: Pool = { players: [], weights: [] };

  for (const p of team.lineup) {
    const pos = p.positions[0] ?? "CM";
    const grp = POSITION_GROUP[pos] ?? "MID";
    const ovr = calcOverall(p, pos);
    const cond = 0.85 + (p.condition / 100) * 0.15;
    const eff = ovr * cond * (1 + p.form * 0.01);
    const a = p.attributes;
    aggrSum += a.aggression ?? 40;

    if (grp === "GK") {
      gk = eff;
      gkPlayer = p;
    } else if (grp === "DEF") {
      defSum += eff;
      defN++;
    } else if (grp === "MID") {
      midSum += eff;
      midN++;
    } else {
      fwdSum += eff;
      fwdN++;
    }

    if (grp !== "GK") {
      const roleW = grp === "FWD" ? 10 : grp === "MID" ? 4 : 1;
      const fin = (a.finishing ?? 30) + (a.positioning ?? 30) * 0.4;
      scorers.players.push(p);
      scorers.weights.push(roleW * (0.5 + fin / 80));

      const create = (a.passing ?? 30) + (a.vision ?? 30) * 0.6 + (a.crossing ?? 30) * 0.4;
      assisters.players.push(p);
      assisters.weights.push((grp === "MID" ? 6 : grp === "FWD" ? 5 : 1.5) * (0.4 + create / 110));

      pacey.players.push(p);
      pacey.weights.push((grp === "FWD" ? 6 : 2) * (0.4 + (a.pace ?? 40) / 80));

      if (grp === "DEF" || pos === "LW" || pos === "RW" || pos === "AM") {
        crossers.players.push(p);
        crossers.weights.push(0.4 + (a.crossing ?? 30) / 70);
      }
    }

    // any outfield player can foul; defenders & holding mids more so
    const foulW = (grp === "DEF" ? 3 : grp === "MID" ? 2 : 1) * (0.5 + (a.aggression ?? 40) / 80);
    if (grp !== "GK") {
      foulers.players.push(p);
      foulers.weights.push(foulW);
    }
  }

  const defense = defN ? defSum / defN : 45;
  const midfield = midN ? midSum / midN : 45;
  const attack = fwdN ? fwdSum / fwdN : midfield * 0.9;

  if (!crossers.players.length && scorers.players.length) {
    crossers.players.push(...scorers.players);
    crossers.weights.push(...scorers.players.map(() => 1));
  }

  return {
    gk,
    gkPlayer,
    attackPower: (attack * 0.5 + midfield * 0.35 + 8) * mentalityAtt(team),
    defPower: (defense * 0.55 + midfield * 0.25 + gk * 0.2 + 8) * mentalityDef(team),
    scorers,
    assisters,
    foulers,
    pacey,
    crossers,
    aggression: team.lineup.length ? aggrSum / team.lineup.length : 45,
  };
}

function expectedGoals(att: TeamPower, def: TeamPower): number {
  const xg = 1.35 * Math.pow(att.attackPower / def.defPower, 1.7);
  return Math.max(0.15, Math.min(5, xg));
}

// ---------------------------------------------------------------------------
// Commentary phrase pools (bilingual, no names — the UI appends the player)
// ---------------------------------------------------------------------------

type Pool2 = LocalizedText[];
const GOAL: Pool2 = [
  { ko: "골! 왼쪽 구석으로 정확히 꽂아 넣습니다!", en: "GOAL! Buried into the bottom corner!" },
  { ko: "골! 침착한 마무리로 골망을 흔듭니다!", en: "GOAL! A cool finish into the net!" },
  { ko: "골! 강력한 슛이 골키퍼를 꿰뚫습니다!", en: "GOAL! A thunderbolt beats the keeper!" },
  { ko: "골! 환상적인 개인 기량으로 득점합니다!", en: "GOAL! Brilliant individual finish!" },
  { ko: "골! 문전 혼전 속에 밀어 넣습니다!", en: "GOAL! Bundled home in the scramble!" },
];
const HEADER: Pool2 = [{ ko: "헤딩 골! 제공권 싸움에서 완벽하게 승리합니다!", en: "Headed GOAL! Towering above the defense!" }];
const SAVE: Pool2 = [
  { ko: "선방! 골키퍼가 환상적으로 막아냅니다!", en: "Great save! The keeper denies them!" },
  { ko: "선방! 반사신경으로 슛을 쳐냅니다!", en: "Save! Superb reflexes to turn it away!" },
  { ko: "선방! 골키퍼가 코너로 밀어냅니다!", en: "Save! Pushed out for a corner!" },
];
const MISS: Pool2 = [
  { ko: "아쉽게 골대를 벗어납니다!", en: "Just wide of the post!" },
  { ko: "크로스바 위로 넘어갑니다!", en: "Skied over the bar!" },
  { ko: "결정적인 기회를 놓칩니다!", en: "A glorious chance goes begging!" },
];
const WOOD: Pool2 = [
  { ko: "골대를 맞고 나옵니다! 운이 없었습니다!", en: "Off the post! So close!" },
  { ko: "크로스바를 강타합니다!", en: "Smashed against the crossbar!" },
];
const CORNER: Pool2 = [{ ko: "코너킥을 얻어냅니다.", en: "Wins a corner." }];
const FOUL: Pool2 = [
  { ko: "거친 태클로 파울을 범합니다.", en: "A clumsy challenge, free kick given." },
  { ko: "상대를 끌어당겨 파울을 내줍니다.", en: "Pulls his man back, foul." },
];
const YELLOW: Pool2 = [{ ko: "경고! 심판이 옐로카드를 꺼냅니다.", en: "Yellow card! Into the book he goes." }];
const RED: Pool2 = [{ ko: "퇴장! 심판이 레드카드를 직접 제시합니다!", en: "RED CARD! He's off!" }];
const OFFSIDE: Pool2 = [{ ko: "오프사이드 깃발이 올라갑니다.", en: "The flag is up — offside." }];
const CHANCE: Pool2 = [
  { ko: "빠른 역습! 위험한 장면을 만듭니다!", en: "Lightning counter — danger!" },
  { ko: "날카로운 침투 패스가 수비를 흔듭니다!", en: "A slicing through-ball splits the defense!" },
];
const INJURY: Pool2 = [{ ko: "부상으로 그라운드에 쓰러집니다.", en: "Down injured on the turf." }];
const EXTRA: { type: string; detail: Pool2 }[] = [
  { type: "pressWin", detail: [{ ko: "강한 압박으로 높은 위치에서 공을 되찾습니다.", en: "The press wins it high up the pitch." }] },
  { type: "throughBall", detail: [{ ko: "스루패스가 수비 라인을 가릅니다.", en: "A through ball splits the back line." }] },
  { type: "cross", detail: [{ ko: "측면에서 날카로운 크로스가 올라옵니다.", en: "A dangerous cross is whipped in." }] },
  { type: "counter", detail: [{ ko: "빠른 역습으로 상대 수비가 흔들립니다.", en: "A quick counter stretches the defense." }] },
  { type: "varCheck", detail: [{ ko: "VAR 판독으로 장면을 확인합니다.", en: "VAR checks the incident." }] },
  { type: "substitution", detail: [{ ko: "벤치에서 교체 카드를 준비합니다.", en: "The bench prepares a substitution." }] },
  { type: "tacticalShift", detail: [{ ko: "감독이 전술 지시를 바꿉니다.", en: "The manager changes the tactical instruction." }] },
  { type: "longShot", detail: [{ ko: "중거리 슛으로 골문을 노립니다.", en: "Tries his luck from distance." }] },
  { type: "dribble", detail: [{ ko: "개인기로 압박을 벗겨냅니다.", en: "Dribbles away from pressure." }] },
  { type: "clearance", detail: [{ ko: "수비가 가까스로 걷어냅니다.", en: "The defense scrambles it clear." }] },
  { type: "throughPress", detail: [{ ko: "중원 압박을 풀고 전진합니다.", en: "Plays through the midfield press." }] },
  { type: "setPiece", detail: [{ ko: "세트피스 상황에서 약속된 움직임을 가져갑니다.", en: "Runs a rehearsed set-piece pattern." }] },
  { type: "cornerKickRoutine", detail: [{ ko: "코너킥 루틴을 짧게 풀어갑니다.", en: "Plays a short corner-kick routine." }] },
  { type: "lineBreak", detail: [{ ko: "패스 한 번으로 라인을 무너뜨립니다.", en: "One pass splits the defensive line." }] },
  { type: "switchPlay", detail: [{ ko: "긴 패스로 측면을 전환합니다.", en: "A long ball switches the play." }] },
  { type: "backHeel", detail: [{ ko: "백힐 패스로 동료를 따돌립니다.", en: "A clever backheel sends a teammate clear." }] },
  { type: "overlap", detail: [{ ko: "풀백이 오버래핑 런으로 가세합니다.", en: "The full-back joins with an overlapping run." }] },
  { type: "trackBack", detail: [{ ko: "전방 선수가 백트랙하며 수비를 돕습니다.", en: "The forward tracks back to help defend." }] },
  { type: "timeWasting", detail: [{ ko: "시간을 끌며 템포를 늦춥니다.", en: "Slows the tempo to waste time." }] },
  { type: "keeperDistribution", detail: [{ ko: "골키퍼가 빌드업을 시작합니다.", en: "The keeper starts the build-up with a throw." }] },
  { type: "offTheBall", detail: [{ ko: "오프더볼 움직임으로 공간을 만듭니다.", en: "A smart off-the-ball run creates space." }] },
  { type: "highLine", detail: [{ ko: "수비라인을 높게 끌어올립니다.", en: "The back line pushes up high." }] },
  { type: "lowBlock", detail: [{ ko: "로우 블록을 형성하며 버팁니다.", en: "Drops into a deep, low block." }] },
  { type: "counterPress", detail: [{ ko: "공을 잃자마자 즉시 재압박합니다.", en: "Counter-presses the moment the ball is lost." }] },
  { type: "setPieceDefense", detail: [{ ko: "세트피스 수비 정비를 마칩니다.", en: "Organizes the set-piece defense." }] },
  { type: "handball", detail: [{ ko: "핸드볼 여부를 확인합니다.", en: "Checks for a possible handball." }] },
  { type: "advantagePlayed", detail: [{ ko: "주심이 어드밴티지를 줍니다.", en: "The referee plays the advantage." }] },
  { type: "quickFreeKick", detail: [{ ko: "빠르게 프리킥을 처리합니다.", en: "Takes the free kick quickly." }] },
  { type: "wallPass", detail: [{ ko: "원터치 월패스로 전진합니다.", en: "A one-touch wall pass advances the ball." }] },
  { type: "shieldBall", detail: [{ ko: "몸으로 공을 지키며 시간을 법니다.", en: "Shields the ball to buy time." }] },
  { type: "lastManTackle", detail: [{ ko: "최후방에서 결정적인 태클이 나옵니다.", en: "A last-man tackle snuffs out the danger." }] },
  { type: "benchReaction", detail: [{ ko: "벤치에서 거세게 항의합니다.", en: "The bench reacts furiously to the call." }] },
];

function phrase(rng: RNG, pool: Pool2): LocalizedText {
  return pool[rng.int(0, pool.length - 1)];
}

// ---------------------------------------------------------------------------
// Picking players by weighted attribute pools
// ---------------------------------------------------------------------------

function pick(rng: RNG, pool: Pool, exclude?: Player): Player | undefined {
  let players = pool.players;
  let weights = pool.weights;
  if (exclude) {
    players = [];
    weights = [];
    for (let i = 0; i < pool.players.length; i++) {
      if (pool.players[i].id !== exclude.id) {
        players.push(pool.players[i]);
        weights.push(pool.weights[i]);
      }
    }
  }
  if (!players.length) return undefined;
  return rng.weighted(players, weights);
}

// ---------------------------------------------------------------------------
// Event timeline builder
// ---------------------------------------------------------------------------

interface Ctx {
  rng: RNG;
  events: MatchEvent[];
  homeId: string;
  awayId: string;
  scorerIds: string[];
  assistIds: string[];
  saves: Record<string, number>;
}

function attackerZone(isHomeAttacking: boolean): PitchZone {
  return isHomeAttacking ? "right" : "left";
}

/** Generate one attacking team's chances. Returns { shots, onTarget }. */
function genAttack(
  ctx: Ctx,
  att: TeamPower,
  def: TeamPower,
  xg: number,
  goals: number,
  attackingHome: boolean,
  attClubId: string,
  defClubId: string,
  loMin: number,
  hiMin: number,
): { shots: number; onTarget: number } {
  const { rng, events } = ctx;
  const zone = attackerZone(attackingHome);

  const shots = Math.max(goals, Math.round(xg * 5 + rng.range(1, 5)));
  const onTarget = Math.max(goals, Math.min(shots, Math.round(xg * 2.2 + rng.range(0, 2))));
  const saved = onTarget - goals;
  const offTarget = shots - onTarget;

  // goals (with optional assist + occasional header)
  for (let i = 0; i < goals; i++) {
    const scorer = pick(rng, att.scorers);
    const header = scorer && (scorer.attributes.heading ?? 0) > 70 && rng.bool(0.22);
    const assister = rng.bool(0.72) ? pick(rng, att.assisters, scorer) : undefined;
    if (scorer) ctx.scorerIds.push(scorer.id);
    if (assister) ctx.assistIds.push(assister.id);
    events.push({
      minute: rng.int(loMin, hiMin),
      type: "goal",
      clubId: attClubId,
      playerId: scorer?.id,
      assistId: assister?.id,
      detail: header ? phrase(rng, HEADER) : phrase(rng, GOAL),
      zone,
    });
  }

  // saved shots -> credited to the defending keeper
  for (let i = 0; i < saved; i++) {
    const gkId = def.gkPlayer?.id;
    if (gkId) ctx.saves[gkId] = (ctx.saves[gkId] ?? 0) + 1;
    events.push({
      minute: rng.int(loMin, hiMin),
      type: "save",
      clubId: defClubId,
      playerId: gkId,
      detail: phrase(rng, SAVE),
      zone,
    });
  }

  // off-target attempts (one may rattle the woodwork)
  let wood = offTarget > 0 && rng.bool(0.18);
  for (let i = 0; i < Math.min(offTarget, 5); i++) {
    const shooter = pick(rng, att.scorers);
    const isWood = wood;
    wood = false;
    events.push({
      minute: rng.int(loMin, hiMin),
      type: isWood ? "woodwork" : "miss",
      clubId: attClubId,
      playerId: shooter?.id,
      detail: isWood ? phrase(rng, WOOD) : phrase(rng, MISS),
      zone,
    });
  }

  // corners
  const corners = Math.min(5, poisson(rng, 1 + xg));
  for (let i = 0; i < corners; i++) {
    const taker = pick(rng, att.crossers);
    events.push({
      minute: rng.int(loMin, hiMin),
      type: "corner",
      clubId: attClubId,
      playerId: taker?.id,
      detail: phrase(rng, CORNER),
      zone,
    });
  }

  // offsides
  const offs = Math.min(3, poisson(rng, 0.7));
  for (let i = 0; i < offs; i++) {
    const runner = pick(rng, att.pacey);
    events.push({
      minute: rng.int(loMin, hiMin),
      type: "offside",
      clubId: attClubId,
      playerId: runner?.id,
      detail: phrase(rng, OFFSIDE),
      zone,
    });
  }

  // big chances (flavor, near-misses already covered)
  const bigC = Math.min(2, poisson(rng, xg * 0.4));
  for (let i = 0; i < bigC; i++) {
    const runner = pick(rng, att.scorers);
    events.push({
      minute: rng.int(loMin, hiMin),
      type: "chance",
      clubId: attClubId,
      playerId: runner?.id,
      detail: phrase(rng, CHANCE),
      zone,
    });
  }

  return { shots, onTarget };
}

/** Fouls, cards and injuries committed by a team. */
function genDiscipline(ctx: Ctx, power: TeamPower, clubId: string, loMin: number, hiMin: number) {
  const { rng, events } = ctx;
  const fouls = Math.min(5, poisson(rng, 1.4 + (power.aggression - 45) / 45));
  let cards = 0;
  for (let i = 0; i < fouls; i++) {
    const fouler = pick(rng, power.foulers);
    events.push({
      minute: rng.int(loMin, hiMin),
      type: "foul",
      clubId,
      playerId: fouler?.id,
      detail: phrase(rng, FOUL),
      zone: "mid",
    });
    // some fouls are booked
    if (cards < 3 && rng.bool(0.32)) {
      cards++;
      events.push({
        minute: rng.int(loMin, hiMin),
        type: "yellow",
        clubId,
        playerId: fouler?.id,
        detail: phrase(rng, YELLOW),
        zone: "mid",
      });
    }
  }
  // rare straight red
  if (rng.bool(0.04)) {
    const p = pick(rng, power.foulers);
    events.push({
      minute: rng.int(30, hiMin),
      type: "red",
      clubId,
      playerId: p?.id,
      detail: phrase(rng, RED),
      zone: "mid",
    });
  }
  // rare injury
  if (rng.bool(0.1)) {
    const p = pick(rng, power.foulers);
    events.push({
      minute: rng.int(loMin + 5, hiMin),
      type: "injury",
      clubId,
      playerId: p?.id,
      detail: phrase(rng, INJURY),
      zone: "mid",
    });
  }
}

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

function ratePlayers(
  team: MatchTeam,
  goalsFor: number,
  goalsAgainst: number,
  ctx: Ctx,
  rng: RNG,
): Record<string, number> {
  const out: Record<string, number> = {};
  const resultBonus = goalsFor > goalsAgainst ? 0.4 : goalsFor < goalsAgainst ? -0.3 : 0;
  for (const p of team.lineup) {
    const grp = POSITION_GROUP[p.positions[0] ?? "CM"] ?? "MID";
    let r = 6.4 + rng.range(-0.5, 0.7) + resultBonus;
    for (const sid of ctx.scorerIds) if (sid === p.id) r += 0.9;
    for (const aid of ctx.assistIds) if (aid === p.id) r += 0.5;
    if (grp === "GK") {
      r += (goalsAgainst === 0 ? 0.6 : 0) - goalsAgainst * 0.15 + (ctx.saves[p.id] ?? 0) * 0.18;
    }
    out[p.id] = Math.max(4, Math.min(10, Math.round(r * 10) / 10));
  }
  return out;
}

function shootout(rng: RNG): [number, number] {
  const kick = () => (rng.bool(0.75) ? 1 : 0);
  let h = 0,
    a = 0;
  for (let i = 0; i < 5; i++) {
    h += kick();
    a += kick();
  }
  while (h === a) {
    h += kick();
    a += kick();
  }
  return [h, a];
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts: SimOptions = {}): MatchResult {
  const allowDraw = opts.allowDraw ?? true;
  const neutral = opts.neutralVenue ?? false;

  const hp = teamPower(home);
  const ap = teamPower(away);

  let homeXg = expectedGoals(hp, ap);
  let awayXg = expectedGoals(ap, hp);
  if (!neutral) {
    homeXg *= 1.12;
    awayXg *= 0.95;
  }

  let homeScore = poisson(rng, homeXg);
  let awayScore = poisson(rng, awayXg);

  const ctx: Ctx = {
    rng,
    events: [],
    homeId: home.club.id,
    awayId: away.club.id,
    scorerIds: [],
    assistIds: [],
    saves: {},
  };

  // Regulation narrative (events spread across both halves, 1'..90')
  const hStat = genAttack(ctx, hp, ap, homeXg, homeScore, true, home.club.id, away.club.id, 1, 90);
  const aStat = genAttack(ctx, ap, hp, awayXg, awayScore, false, away.club.id, home.club.id, 1, 90);
  genDiscipline(ctx, hp, home.club.id, 8, 90);
  genDiscipline(ctx, ap, away.club.id, 8, 90);
  for (let i = 0; i < 16; i++) {
    const homeEvent = rng.bool(0.5);
    const power = homeEvent ? hp : ap;
    const clubId = homeEvent ? home.club.id : away.club.id;
    const item = EXTRA[rng.int(0, EXTRA.length - 1)];
    const pool = rng.bool(0.45) ? power.assisters : rng.bool(0.5) ? power.pacey : power.crossers;
    const p = pick(rng, pool);
    ctx.events.push({
      minute: rng.int(1, 90),
      type: item.type,
      clubId,
      playerId: p?.id,
      detail: phrase(rng, item.detail),
      zone: homeEvent ? "right" : "left",
    });
  }

  let decidedBy: MatchResult["decidedBy"] = "normal";
  let winnerId: string | undefined;
  let homePens: number | undefined;
  let awayPens: number | undefined;

  if (homeScore > awayScore) winnerId = home.club.id;
  else if (awayScore > homeScore) winnerId = away.club.id;

  if (!allowDraw && homeScore === awayScore) {
    const etH = poisson(rng, homeXg * 0.35);
    const etA = poisson(rng, awayXg * 0.35);
    genAttack(ctx, hp, ap, homeXg * 0.35, etH, true, home.club.id, away.club.id, 91, 120);
    genAttack(ctx, ap, hp, awayXg * 0.35, etA, false, away.club.id, home.club.id, 91, 120);
    homeScore += etH;
    awayScore += etA;
    if (homeScore !== awayScore) {
      decidedBy = "extra_time";
      winnerId = homeScore > awayScore ? home.club.id : away.club.id;
    } else {
      decidedBy = "penalties";
      [homePens, awayPens] = shootout(rng);
      winnerId = homePens > awayPens ? home.club.id : away.club.id;
      ctx.events.push({
        minute: 121,
        type: "penalty_shootout",
        clubId: winnerId,
        detail: { ko: `승부차기 ${homePens} - ${awayPens} 승리!`, en: `Wins ${homePens}-${awayPens} on penalties!` },
        zone: "mid",
      });
    }
  }

  ctx.events.sort((a, b) => a.minute - b.minute);

  const playerRatings = {
    ...ratePlayers(home, homeScore, awayScore, ctx, rng),
    ...ratePlayers(away, awayScore, homeScore, ctx, rng),
  };

  const homePoss = Math.round(
    50 + ((hp.attackPower + 100) / (hp.attackPower + ap.attackPower + 200) - 0.5) * 100,
  );

  return {
    fixtureId: "",
    homeId: home.club.id,
    awayId: away.club.id,
    homeScore,
    awayScore,
    events: ctx.events,
    playerRatings,
    stats: {
      homePossession: Math.max(30, Math.min(70, homePoss)),
      homeShots: hStat.shots,
      awayShots: aStat.shots,
      homeShotsOnTarget: hStat.onTarget,
      awayShotsOnTarget: aStat.onTarget,
    },
    winnerId,
    decidedBy,
    homePens,
    awayPens,
  };
}
