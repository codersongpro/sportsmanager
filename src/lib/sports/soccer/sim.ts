import type {
  MatchEvent,
  MatchResult,
  MatchTeam,
  Player,
  SimOptions,
} from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { POSITION_GROUP } from "./constants";
import { calcOverall } from "./ratings";

interface TeamPower {
  gk: number;
  attackPower: number;
  defPower: number;
  scorers: Player[];
  scorerWeights: number[];
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
  return m.club.tactics.mentality === "attacking"
    ? 1.12
    : m.club.tactics.mentality === "defensive"
      ? 0.9
      : 1;
}
function mentalityDef(m: MatchTeam): number {
  return m.club.tactics.mentality === "attacking"
    ? 0.92
    : m.club.tactics.mentality === "defensive"
      ? 1.12
      : 1;
}

function teamPower(team: MatchTeam): TeamPower {
  let gk = 42;
  let defSum = 0,
    defN = 0,
    midSum = 0,
    midN = 0,
    fwdSum = 0,
    fwdN = 0,
    aggrSum = 0;
  const scorers: Player[] = [];
  const scorerWeights: number[] = [];

  for (const p of team.lineup) {
    const pos = p.positions[0] ?? "CM";
    const grp = POSITION_GROUP[pos] ?? "MID";
    const ovr = calcOverall(p, pos);
    const cond = 0.85 + (p.condition / 100) * 0.15;
    const eff = ovr * cond * (1 + p.form * 0.01);
    aggrSum += p.attributes.aggression ?? 40;

    if (grp === "GK") gk = eff;
    else if (grp === "DEF") (defSum += eff), defN++;
    else if (grp === "MID") (midSum += eff), midN++;
    else (fwdSum += eff), fwdN++;

    // goal-scoring weight by role + finishing instinct
    const fin = (p.attributes.finishing ?? 30) + (p.attributes.positioning ?? 30) * 0.4;
    const roleW = grp === "FWD" ? 10 : grp === "MID" ? 4 : grp === "DEF" ? 1 : 0.05;
    if (grp !== "GK") {
      scorers.push(p);
      scorerWeights.push(roleW * (0.5 + fin / 80));
    }
  }

  const defense = defN ? defSum / defN : 45;
  const midfield = midN ? midSum / midN : 45;
  const attack = fwdN ? fwdSum / fwdN : midfield * 0.9;

  const attackPower = (attack * 0.5 + midfield * 0.35 + 8) * mentalityAtt(team);
  const defPower = (defense * 0.55 + midfield * 0.25 + gk * 0.2 + 8) * mentalityDef(team);

  return {
    gk,
    attackPower,
    defPower,
    scorers,
    scorerWeights,
    aggression: team.lineup.length ? aggrSum / team.lineup.length : 45,
  };
}

function expectedGoals(att: TeamPower, def: TeamPower): number {
  const xg = 1.35 * Math.pow(att.attackPower / def.defPower, 1.7);
  return Math.max(0.15, Math.min(5, xg));
}

function pickScorer(rng: RNG, power: TeamPower): Player | undefined {
  if (!power.scorers.length) return undefined;
  return rng.weighted(power.scorers, power.scorerWeights);
}

function addGoals(
  rng: RNG,
  events: MatchEvent[],
  power: TeamPower,
  clubId: string,
  n: number,
  minMin: number,
  maxMin: number,
) {
  for (let i = 0; i < n; i++) {
    const scorer = pickScorer(rng, power);
    events.push({
      minute: rng.int(minMin, maxMin),
      type: "goal",
      clubId,
      playerId: scorer?.id,
      detail: { ko: "골!", en: "Goal!" },
    });
  }
}

function addCards(rng: RNG, events: MatchEvent[], team: MatchTeam, power: TeamPower) {
  const n = poisson(rng, 0.9 + (power.aggression - 45) / 60);
  for (let i = 0; i < n; i++) {
    const p = rng.pick(team.lineup);
    events.push({
      minute: rng.int(10, 90),
      type: "yellow",
      clubId: team.club.id,
      playerId: p.id,
      detail: { ko: "경고", en: "Yellow card" },
    });
  }
  // rare injury
  if (rng.bool(0.08)) {
    const p = rng.pick(team.lineup);
    events.push({
      minute: rng.int(15, 85),
      type: "injury",
      clubId: team.club.id,
      playerId: p.id,
      detail: { ko: "부상", en: "Injury" },
    });
  }
}

function ratePlayers(
  team: MatchTeam,
  goalsFor: number,
  goalsAgainst: number,
  scorerIds: string[],
  rng: RNG,
): Record<string, number> {
  const out: Record<string, number> = {};
  const resultBonus = goalsFor > goalsAgainst ? 0.4 : goalsFor < goalsAgainst ? -0.3 : 0;
  for (const p of team.lineup) {
    const grp = POSITION_GROUP[p.positions[0] ?? "CM"] ?? "MID";
    let r = 6.4 + rng.range(-0.5, 0.7) + resultBonus;
    for (const sid of scorerIds) if (sid === p.id) r += 0.9;
    if (grp === "GK") r += (goalsAgainst === 0 ? 0.6 : 0) - goalsAgainst * 0.15;
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

export function simulateMatch(
  home: MatchTeam,
  away: MatchTeam,
  rng: RNG,
  opts: SimOptions = {},
): MatchResult {
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

  const events: MatchEvent[] = [];
  let homeScore = poisson(rng, homeXg);
  let awayScore = poisson(rng, awayXg);
  addGoals(rng, events, hp, home.club.id, homeScore, 1, 90);
  addGoals(rng, events, ap, away.club.id, awayScore, 1, 90);
  addCards(rng, events, home, hp);
  addCards(rng, events, away, ap);

  let decidedBy: MatchResult["decidedBy"] = "normal";
  let winnerId: string | undefined;
  let homePens: number | undefined;
  let awayPens: number | undefined;

  if (homeScore > awayScore) winnerId = home.club.id;
  else if (awayScore > homeScore) winnerId = away.club.id;

  if (!allowDraw && homeScore === awayScore) {
    // extra time
    const etH = poisson(rng, homeXg * 0.35);
    const etA = poisson(rng, awayXg * 0.35);
    homeScore += etH;
    awayScore += etA;
    addGoals(rng, events, hp, home.club.id, etH, 91, 120);
    addGoals(rng, events, ap, away.club.id, etA, 91, 120);
    if (homeScore !== awayScore) {
      decidedBy = "extra_time";
      winnerId = homeScore > awayScore ? home.club.id : away.club.id;
    } else {
      decidedBy = "penalties";
      [homePens, awayPens] = shootout(rng);
      winnerId = homePens > awayPens ? home.club.id : away.club.id;
      events.push({
        minute: 121,
        type: "penalty_shootout",
        clubId: winnerId,
        detail: { ko: `승부차기 ${homePens}-${awayPens}`, en: `Penalties ${homePens}-${awayPens}` },
      });
    }
  }

  events.sort((a, b) => a.minute - b.minute);

  const scorerIds = events.filter((e) => e.type === "goal" && e.playerId).map((e) => e.playerId!);
  const playerRatings = {
    ...ratePlayers(home, homeScore, awayScore, scorerIds, rng),
    ...ratePlayers(away, awayScore, homeScore, scorerIds, rng),
  };

  const totalShotsBase = (homeXg + awayXg) * 4;
  const homePoss = Math.round(
    50 + ((hp.attackPower + 100) / (hp.attackPower + ap.attackPower + 200) - 0.5) * 100,
  );

  return {
    fixtureId: "",
    homeId: home.club.id,
    awayId: away.club.id,
    homeScore,
    awayScore,
    events,
    playerRatings,
    stats: {
      homePossession: Math.max(30, Math.min(70, homePoss)),
      homeShots: Math.round(homeXg * 5 + rng.range(0, 4)),
      awayShots: Math.round(awayXg * 5 + rng.range(0, 4)),
      homeShotsOnTarget: Math.round(homeXg * 2 + rng.range(0, 2)),
      awayShotsOnTarget: Math.round(awayXg * 2 + rng.range(0, 2)),
    },
    winnerId,
    decidedBy,
    homePens,
    awayPens,
  };
}
