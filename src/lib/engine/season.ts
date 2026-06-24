import type { Club, GameState, SimOptions, SportModule } from "@/lib/types";
import { createRng, type RNG } from "@/lib/sim/rng";
import { createLeague, createTournament, isComplete } from "./competition";
import { beginActiveMatch } from "./activeMatch";
import { finishMatch, resolveTeam } from "./matchFlow";

const WEEK = 7;
// Safety cap on how many calendar days a single "continue" can advance through
// (covers a full season with no scheduled fixture for the user's club for a
// while, e.g. early tournament byes) without ever looping forever.
const MAX_DAYS_PER_CONTINUE = 400;

function playMatchesForDay(state: GameState, sport: SportModule, rng: RNG) {
  const comp = state.competition;
  const todays = comp.fixtures.filter((f) => !f.played && f.day === state.day);
  for (const fixture of todays) {
    const home = state.clubs[fixture.homeId];
    const away = fixture.awayId ? state.clubs[fixture.awayId] : undefined;
    if (!home || !away) continue; // bye fixtures are auto-resolved by the competition engine

    const isUserMatch = fixture.homeId === state.manager.clubId || fixture.awayId === state.manager.clubId;
    if (isUserMatch && sport.simulateSegment && sport.finalizeSegments) {
      // play the user's own match out segment by segment instead of resolving it atomically
      if (!state.activeMatch) state.activeMatch = beginActiveMatch(state, fixture);
      continue;
    }

    const homeTeam = resolveTeam(home, state.players, sport);
    const awayTeam = resolveTeam(away, state.players, sport);
    const opts: SimOptions = {
      allowDraw: comp.format === "league",
      neutralVenue: comp.kind === "national",
    };
    const result = sport.simulateMatch(homeTeam, awayTeam, rng, opts);
    result.fixtureId = fixture.id;
    finishMatch(state, comp, fixture.id, home, away, homeTeam, awayTeam, result);
  }
}

function processWeeklyFinances(state: GameState) {
  for (const club of Object.values(state.clubs)) {
    if (club.isNational) continue;
    const wageBill = club.squad.reduce((s, id) => s + (state.players[id]?.wage ?? 0), 0);
    const income = Math.round(club.reputation * 1800 + wageBill * 0.15);
    club.finances.balance += income - wageBill;
  }
}

function applyWeeklyTraining(state: GameState, sport: SportModule, rng: RNG) {
  for (const club of Object.values(state.clubs)) {
    const focus = club.id === state.manager.clubId ? state.trainingFocus : "balanced";
    for (const id of club.squad) {
      const p = state.players[id];
      if (!p) continue;
      state.players[id] = sport.trainPlayer(p, focus, rng);
    }
  }
}

/**
 * Advance the calendar until the next event relevant to the user: their own
 * fixture is played, or the competition concludes. Mutates a deep copy of
 * `state` and returns it; the RNG resumes exactly where it left off via the
 * serialized `rngState`.
 */
export function continueGame(state: GameState, sport: SportModule): GameState {
  if (state.seasonOver) return state;
  // a match is mid-flight: the user must finish playing it (advanceActiveMatch)
  // before the calendar can move forward any further
  if (state.activeMatch && !state.activeMatch.finished) return state;
  const next: GameState = structuredClone(state);
  const rng = createRng(next.rngState);
  next.lastResultFixtureId = undefined;

  let steps = 0;
  while (steps++ < MAX_DAYS_PER_CONTINUE) {
    next.day += 1;
    playMatchesForDay(next, sport, rng);
    if (next.day % WEEK === 0) {
      processWeeklyFinances(next);
      applyWeeklyTraining(next, sport, rng);
    }
    if (next.lastResultFixtureId || next.activeMatch || isComplete(next.competition)) break;
  }

  if (isComplete(next.competition)) next.seasonOver = true;
  next.rngState = rng.state();
  next.updatedAt = Date.now();
  return next;
}

/** Age every player, then build a fresh competition for the new season. */
export function rolloverSeason(state: GameState, sport: SportModule): GameState {
  const next: GameState = structuredClone(state);
  const rng = createRng(next.rngState);

  for (const id in next.players) {
    next.players[id] = sport.ageAndDevelop(next.players[id], rng);
  }

  next.season += 1;
  next.day += WEEK; // short preseason gap
  next.seasonOver = false;

  const clubs = next.competition.clubIds.map((id) => next.clubs[id]).filter((c): c is Club => !!c);
  const startDay = next.day;
  next.competition =
    next.competition.format === "league"
      ? createLeague(next.competition.id, next.competition.name, next.competition.country, clubs, next.season)
      : createTournament(
          next.competition.id,
          next.competition.name,
          next.competition.country,
          next.competition.kind,
          clubs,
          next.season,
        );
  for (const f of next.competition.fixtures) f.day += startDay;

  for (const club of clubs) {
    const picked = sport.autoPickLineup(club, next.players);
    club.tactics.lineup = picked.lineup;
    club.tactics.bench = picked.bench;
  }

  next.rngState = rng.state();
  next.updatedAt = Date.now();
  return next;
}
