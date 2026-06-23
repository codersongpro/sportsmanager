import type {
  BracketRound,
  Club,
  CompetitionState,
  Fixture,
  LeagueRow,
  LocalizedText,
  MatchResult,
} from "@/lib/types";

const WEEK = 7;

// ---------------------------------------------------------------------------
// League (double round-robin)
// ---------------------------------------------------------------------------

function emptyRow(clubId: string): LeagueRow {
  return { clubId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

function roundRobin(ids: string[]): { round: number; home: string; away: string }[] {
  const teams = [...ids];
  if (teams.length % 2 === 1) teams.push("BYE");
  const n = teams.length;
  const rounds = n - 1;
  const half = n / 2;
  const out: { round: number; home: string; away: string }[] = [];
  let arr = [...teams];
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== "BYE" && b !== "BYE") {
        const [home, away] = r % 2 === 0 ? [a, b] : [b, a];
        out.push({ round: r, home, away });
      }
    }
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }
  return out;
}

export function createLeague(
  id: string,
  name: LocalizedText,
  country: string,
  clubs: Club[],
  season: number,
): CompetitionState {
  const ids = clubs.map((c) => c.id);
  const single = roundRobin(ids);
  const singleRounds = Math.max(...single.map((m) => m.round)) + 1;

  const fixtures: Fixture[] = [];
  let fid = 0;
  // first half
  for (const m of single) {
    fixtures.push(mkFixture(`f${fid++}`, m.round, m.home, m.away, m.round * WEEK + 3));
  }
  // reverse half
  for (const m of single) {
    const round = m.round + singleRounds;
    fixtures.push(mkFixture(`f${fid++}`, round, m.away, m.home, round * WEEK + 3));
  }

  return {
    id,
    name,
    format: "league",
    kind: "club",
    country,
    clubIds: ids,
    fixtures,
    season,
    currentRound: 0,
    totalRounds: singleRounds * 2,
    table: ids.map(emptyRow),
    championId: null,
  };
}

function mkFixture(id: string, round: number, home: string, away: string, day: number): Fixture {
  return { id, round, homeId: home, awayId: away, day, played: false };
}

function applyToTable(table: LeagueRow[], r: MatchResult) {
  const home = table.find((t) => t.clubId === r.homeId)!;
  const away = table.find((t) => t.clubId === r.awayId)!;
  home.played++;
  away.played++;
  home.goalsFor += r.homeScore;
  home.goalsAgainst += r.awayScore;
  away.goalsFor += r.awayScore;
  away.goalsAgainst += r.homeScore;
  if (r.homeScore > r.awayScore) {
    home.won++;
    away.lost++;
    home.points += 3;
  } else if (r.homeScore < r.awayScore) {
    away.won++;
    home.lost++;
    away.points += 3;
  } else {
    home.drawn++;
    away.drawn++;
    home.points++;
    away.points++;
  }
}

export function sortTable(table: LeagueRow[]): LeagueRow[] {
  return [...table].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });
}

// ---------------------------------------------------------------------------
// Tournament (single elimination)
// ---------------------------------------------------------------------------

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Standard bracket seed order for a power-of-two size P (values 1..P). */
function seedSlots(P: number): number[] {
  let slots = [1, 2];
  while (slots.length < P) {
    const sum = slots.length * 2 + 1;
    const next: number[] = [];
    for (const s of slots) {
      next.push(s, sum - s);
    }
    slots = next;
  }
  return slots;
}

function roundName(matchesInRound: number): LocalizedText {
  switch (matchesInRound) {
    case 1: return { ko: "결승", en: "Final" };
    case 2: return { ko: "준결승", en: "Semi-final" };
    case 4: return { ko: "8강", en: "Quarter-final" };
    case 8: return { ko: "16강", en: "Round of 16" };
    case 16: return { ko: "32강", en: "Round of 32" };
    case 32: return { ko: "64강", en: "Round of 64" };
    default: return { ko: `${matchesInRound * 2}강`, en: `Round of ${matchesInRound * 2}` };
  }
}

export function createTournament(
  id: string,
  name: LocalizedText,
  country: string,
  kind: "club" | "national",
  clubs: Club[],
  season: number,
): CompetitionState {
  const seeded = [...clubs].sort((a, b) => b.reputation - a.reputation);
  const P = nextPow2(seeded.length);
  const order = seedSlots(P); // seed values 1..P in bracket slot order
  const slotClubIds: (string | null)[] = order.map((seed) =>
    seed - 1 < seeded.length ? seeded[seed - 1].id : null,
  );

  const totalRounds = Math.log2(P);
  const bracket: BracketRound[] = [];
  for (let r = 0; r < totalRounds; r++) {
    const matchesInRound = P / 2 ** (r + 1);
    bracket.push({
      name: roundName(matchesInRound),
      roundIndex: r,
      matches: Array.from({ length: matchesInRound }, () => ({
        fixtureId: null,
        homeId: null,
        awayId: null,
        winnerId: null,
      })),
    });
  }

  // Fill round 0 from slot pairs; byes auto-advance.
  const fixtures: Fixture[] = [];
  let fid = 0;
  for (let m = 0; m < bracket[0].matches.length; m++) {
    const home = slotClubIds[m * 2];
    const away = slotClubIds[m * 2 + 1];
    const match = bracket[0].matches[m];
    match.homeId = home;
    match.awayId = away;
    if (home && away) {
      const fixture = mkFixture(`t${fid++}`, 0, home, away, 0 * WEEK + 3);
      fixture.bracketSlot = m;
      match.fixtureId = fixture.id;
      fixtures.push(fixture);
    } else {
      match.winnerId = home ?? away ?? null; // bye
    }
  }

  return {
    id,
    name,
    format: "tournament",
    kind,
    country,
    clubIds: seeded.map((c) => c.id),
    fixtures,
    season,
    currentRound: 0,
    totalRounds,
    bracket,
    championId: null,
  };
}

function buildNextRound(state: CompetitionState) {
  const bracket = state.bracket!;
  const r = state.currentRound;
  if (r + 1 >= bracket.length) return;
  const cur = bracket[r];
  const next = bracket[r + 1];
  let fid = state.fixtures.length;
  for (let m = 0; m < next.matches.length; m++) {
    const home = cur.matches[m * 2].winnerId;
    const away = cur.matches[m * 2 + 1].winnerId;
    const match = next.matches[m];
    match.homeId = home;
    match.awayId = away;
    if (home && away) {
      const fixture = mkFixture(`t${fid++}`, r + 1, home, away, (r + 1) * WEEK + 3);
      fixture.bracketSlot = m;
      match.fixtureId = fixture.id;
      state.fixtures.push(fixture);
    } else {
      match.winnerId = home ?? away ?? null;
    }
  }
  state.currentRound = r + 1;
}

// ---------------------------------------------------------------------------
// Recording results (mutates the competition state in place)
// ---------------------------------------------------------------------------

export function recordResult(state: CompetitionState, result: MatchResult) {
  const fixture = state.fixtures.find((f) => f.id === result.fixtureId);
  if (!fixture || fixture.played) return;
  fixture.played = true;
  fixture.result = result;

  if (state.format === "league" && state.table) {
    applyToTable(state.table, result);
    // league "round" advances when all fixtures up to a matchday are played
    const maxPlayedRound = Math.max(
      0,
      ...state.fixtures.filter((f) => f.played).map((f) => f.round),
    );
    state.currentRound = maxPlayedRound;
    if (state.fixtures.every((f) => f.played)) {
      state.championId = sortTable(state.table)[0]?.clubId ?? null;
    }
    return;
  }

  if (state.format === "tournament" && state.bracket) {
    const round = state.bracket[fixture.round];
    const match = round.matches.find((mm) => mm.fixtureId === fixture.id);
    if (match) match.winnerId = result.winnerId ?? result.homeId;

    const roundDone = round.matches.every((mm) => mm.winnerId !== null);
    if (roundDone) {
      if (fixture.round + 1 < state.bracket.length) {
        buildNextRound(state);
      } else {
        state.championId = round.matches[0].winnerId;
      }
    }
  }
}

export function isComplete(state: CompetitionState): boolean {
  return !!state.championId;
}

/** Fixtures not yet played, earliest day first. */
export function upcomingFixtures(state: CompetitionState): Fixture[] {
  return state.fixtures.filter((f) => !f.played).sort((a, b) => a.day - b.day);
}
