import type { Club, GameState, MatchResult, MatchTeam, NewsItem, Player, SimOptions, SportModule } from "@/lib/types";
import { createRng, type RNG } from "@/lib/sim/rng";
import { createLeague, createTournament, isComplete, recordResult } from "./competition";
import { makePostMatchPress } from "./press";

const WEEK = 7;
// Safety cap on how many calendar days a single "continue" can advance through
// (covers a full season with no scheduled fixture for the user's club for a
// while, e.g. early tournament byes) without ever looping forever.
const MAX_DAYS_PER_CONTINUE = 400;

function resolveTeam(club: Club, players: Record<string, Player>, sport: SportModule): MatchTeam {
  let ids = club.tactics.lineup.filter((id) => players[id]);
  if (ids.length < 11) {
    ids = sport.autoPickLineup(club, players).lineup;
  }
  return { club, lineup: ids.map((id) => players[id]) };
}

function pushNews(state: GameState, title: NewsItem["title"], body?: NewsItem["body"]) {
  state.news.unshift({ id: `n${state.day}_${state.news.length}`, day: state.day, title, body, read: false });
  if (state.news.length > 200) state.news.length = 200;
}

function bumpApps(players: Record<string, Player>, id: string) {
  const p = players[id];
  if (p) p.apps = (p.apps ?? 0) + 1;
}

/** Record a match into each lineup player's recent-form history (last 6). */
function recordForm(
  players: Record<string, Player>,
  lineup: string[],
  ratings: Record<string, number>,
  oppShort: string,
  result: "W" | "D" | "L",
  scoreFor: number,
  scoreAgainst: number,
  day: number,
) {
  for (const id of lineup) {
    const p = players[id];
    if (!p) continue;
    const form = (p.recentForm ??= []);
    form.push({ day, rating: ratings[id] ?? 6, oppShort, result, scoreFor, scoreAgainst });
    if (form.length > 6) form.splice(0, form.length - 6);
  }
}

function outcomeFor(forHome: boolean, r: MatchResult): "W" | "D" | "L" {
  const mine = forHome ? r.homeScore : r.awayScore;
  const theirs = forHome ? r.awayScore : r.homeScore;
  if (mine > theirs) return "W";
  if (mine < theirs) return "L";
  return "D";
}

function playMatchesForDay(state: GameState, sport: SportModule, rng: RNG) {
  const comp = state.competition;
  const todays = comp.fixtures.filter((f) => !f.played && f.day === state.day);
  for (const fixture of todays) {
    const home = state.clubs[fixture.homeId];
    const away = fixture.awayId ? state.clubs[fixture.awayId] : undefined;
    if (!home || !away) continue; // bye fixtures are auto-resolved by the competition engine

    const homeTeam = resolveTeam(home, state.players, sport);
    const awayTeam = resolveTeam(away, state.players, sport);
    const opts: SimOptions = {
      allowDraw: comp.format === "league",
      neutralVenue: comp.kind === "national",
    };
    const result = sport.simulateMatch(homeTeam, awayTeam, rng, opts);
    result.fixtureId = fixture.id;
    recordResult(comp, result);

    for (const p of homeTeam.lineup) bumpApps(state.players, p.id);
    for (const p of awayTeam.lineup) bumpApps(state.players, p.id);

    recordForm(state.players, homeTeam.lineup.map((p) => p.id), result.playerRatings, away.shortName, outcomeFor(true, result), result.homeScore, result.awayScore, state.day);
    recordForm(state.players, awayTeam.lineup.map((p) => p.id), result.playerRatings, home.shortName, outcomeFor(false, result), result.awayScore, result.homeScore, state.day);

    pushNews(state, {
      ko: `${home.nameKo ?? home.name} ${result.homeScore} - ${result.awayScore} ${away.nameKo ?? away.name}`,
      en: `${home.name} ${result.homeScore} - ${result.awayScore} ${away.name}`,
    });

    const userIsHome = fixture.homeId === state.manager.clubId;
    if (userIsHome || fixture.awayId === state.manager.clubId) {
      state.lastResultFixtureId = fixture.id;
      const outcome = outcomeFor(userIsHome, result);
      const oppShort = userIsHome ? away.shortName : home.shortName;
      applyManagerRep(state, outcome, userIsHome ? home.reputation : away.reputation, userIsHome ? away.reputation : home.reputation);
      const press = (state.press ??= []);
      press.push(makePostMatchPress(`press_${state.day}_${fixture.id}`, state.day, outcome, oppShort));
      if (press.length > 12) press.splice(0, press.length - 12);
    }
  }
}

/** Manager reputation drifts with results; upsets count for more. */
function applyManagerRep(state: GameState, outcome: "W" | "D" | "L", myRep: number, oppRep: number) {
  let delta = 0;
  if (outcome === "W") delta = 1 + Math.max(0, oppRep - myRep) / 18;
  else if (outcome === "L") delta = -1 - Math.max(0, myRep - oppRep) / 24;
  else delta = (oppRep - myRep) / 40;
  state.manager.reputation = Math.max(1, Math.min(99, Math.round((state.manager.reputation + delta) * 10) / 10));
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
    if (next.lastResultFixtureId || isComplete(next.competition)) break;
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
