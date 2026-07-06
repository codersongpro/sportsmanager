import type { Club, GameState, SimOptions, SportModule } from "@/lib/types";
import { createRng, type RNG } from "@/lib/sim/rng";
import { createLeague, createTournament, isComplete, recordResult, sortTable } from "./competition";
import { beginActiveMatch } from "./activeMatch";
import { applyPostMatchPlayerEffects, bumpApps, finishMatch, outcomeFor, pushNews, recordForm, resolveTeam } from "./matchFlow";

const WEEK = 7;
// Safety cap on how many calendar days a single "continue" can advance through
// (covers a full season with no scheduled fixture for the user's club for a
// while, e.g. early tournament byes) without ever looping forever.
const MAX_DAYS_PER_CONTINUE = 400;
// how many clubs swap tiers at season rollover (out of 8-club leagues)
export const PROMOTION_RELEGATION_COUNT = 2;

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
      if (!state.activeMatch) state.activeMatch = beginActiveMatch(state, fixture, sport);
      continue;
    }

    const homeTeam = resolveTeam(home, state.players, sport, state.day);
    const awayTeam = resolveTeam(away, state.players, sport, state.day);
    const opts: SimOptions = {
      allowDraw: comp.format === "league",
      neutralVenue: comp.kind === "national",
    };
    const result = sport.simulateMatch(homeTeam, awayTeam, rng, opts);
    result.fixtureId = fixture.id;
    finishMatch(state, comp, fixture.id, home, away, homeTeam, awayTeam, result, rng);
  }
}

/** Resolve the promotion/relegation partner division's fixtures for the day. Entirely AI vs AI, so every match is resolved atomically with no news/press noise. */
function playPartnerMatchesForDay(state: GameState, sport: SportModule, rng: RNG) {
  const comp = state.partnerCompetition;
  if (!comp) return;
  const todays = comp.fixtures.filter((f) => !f.played && f.day === state.day);
  for (const fixture of todays) {
    const home = state.clubs[fixture.homeId];
    const away = fixture.awayId ? state.clubs[fixture.awayId] : undefined;
    if (!home || !away) continue;

    const homeTeam = resolveTeam(home, state.players, sport, state.day);
    const awayTeam = resolveTeam(away, state.players, sport, state.day);
    const result = sport.simulateMatch(homeTeam, awayTeam, rng, { allowDraw: comp.format === "league", neutralVenue: false });
    result.fixtureId = fixture.id;
    recordResult(comp, result);

    for (const p of homeTeam.lineup) bumpApps(state.players, p.id);
    for (const p of awayTeam.lineup) bumpApps(state.players, p.id);
    recordForm(state.players, homeTeam.lineup.map((p) => p.id), result.playerRatings, away.shortName, outcomeFor(true, result), result.homeScore, result.awayScore, state.day);
    recordForm(state.players, awayTeam.lineup.map((p) => p.id), result.playerRatings, home.shortName, outcomeFor(false, result), result.awayScore, result.homeScore, state.day);
    applyPostMatchPlayerEffects(state, comp, homeTeam, awayTeam, result, state.day, rng);
  }
}

/** Daily condition recovery for every player; injured players recover slower and cap lower. */
function applyDailyRecovery(state: GameState) {
  for (const id in state.players) {
    const p = state.players[id];
    let rate = p.age <= 29 ? 4.5 : 3.5;
    const injured = p.injuredUntilDay != null && p.injuredUntilDay > state.day;
    if (injured) rate *= 0.5;
    p.condition = Math.min(injured ? 85 : 100, p.condition + rate);
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
  const userClubId = state.manager.clubId;
  const userFocus = state.trainingFocus;
  const trainingDeltas: { playerId: string; ovrBefore: number; ovrAfter: number }[] = [];

  for (const club of Object.values(state.clubs)) {
    const focus = club.id === userClubId ? userFocus : "balanced";
    const isUserClub = club.id === userClubId;
    for (const id of club.squad) {
      const p = state.players[id];
      if (!p) continue;
      const ovrBefore = isUserClub ? sport.calcOverall(p) : 0;
      const trained = sport.trainPlayer(p, focus, rng);
      state.players[id] = trained;
      if (isUserClub) {
        const ovrAfter = sport.calcOverall(trained);
        if (ovrAfter - ovrBefore >= 0.05) trainingDeltas.push({ playerId: id, ovrBefore, ovrAfter });
      }

      const alreadyInjured = trained.injuredUntilDay != null && trained.injuredUntilDay > state.day;
      if (!alreadyInjured && rng.bool(0.008)) {
        trained.injuredUntilDay = state.day + 3 + rng.int(0, 11);
        if (isUserClub) {
          const name = trained.nameKo ?? trained.name;
          pushNews(state, { ko: `${name} 훈련 중 부상`, en: `${trained.name} injured in training` });
        }
      }
    }
  }

  trainingDeltas.sort((a, b) => (b.ovrAfter - b.ovrBefore) - (a.ovrAfter - a.ovrBefore));
  state.lastTrainingReport = { day: state.day, focus: userFocus, entries: trainingDeltas.slice(0, 8) };
  const bigImprover = trainingDeltas.find((d) => d.ovrAfter - d.ovrBefore >= 0.5);
  if (bigImprover) {
    const p = state.players[bigImprover.playerId];
    const name = p.nameKo ?? p.name;
    const delta = (bigImprover.ovrAfter - bigImprover.ovrBefore).toFixed(1);
    pushNews(state, { ko: `훈련 성과: ${name} 급성장 (+${delta})`, en: `Training: ${p.name} improving fast (+${delta})` });
  }
}

/** Weekly morale decay: every player drifts 10% of the way toward a neutral baseline. */
function processWeeklyUpkeep(state: GameState) {
  for (const id in state.players) {
    const p = state.players[id];
    p.morale = Math.round((p.morale + (55 - p.morale) * 0.1) * 10) / 10;
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
    applyDailyRecovery(next);
    playMatchesForDay(next, sport, rng);
    playPartnerMatchesForDay(next, sport, rng);
    if (next.day % WEEK === 0) {
      processWeeklyFinances(next);
      applyWeeklyTraining(next, sport, rng);
      processWeeklyUpkeep(next);
    }
    if (next.lastResultFixtureId || next.activeMatch || isComplete(next.competition)) break;
  }

  if (isComplete(next.competition)) next.seasonOver = true;
  next.rngState = rng.state();
  next.updatedAt = Date.now();
  return next;
}

function rebuildLeagueOrTournament(
  comp: { id: string; name: GameState["competition"]["name"]; country: string; format: GameState["competition"]["format"]; kind: GameState["competition"]["kind"] },
  clubs: Club[],
  season: number,
) {
  return comp.format === "league"
    ? createLeague(comp.id, comp.name, comp.country, clubs, season, comp.kind)
    : createTournament(comp.id, comp.name, comp.country, comp.kind, clubs, season);
}

/** Age every player, swap promotion/relegation tiers (if a partner division exists), then build fresh competitions for the new season. */
export function rolloverSeason(state: GameState, sport: SportModule): GameState {
  const next: GameState = structuredClone(state);
  const rng = createRng(next.rngState);

  for (const id in next.players) {
    next.players[id] = sport.ageAndDevelop(next.players[id], rng);
  }

  next.season += 1;
  next.day += WEEK; // short preseason gap
  next.seasonOver = false;

  let mainClubIds = next.competition.clubIds;
  let partnerClubIds = next.partnerCompetition?.clubIds ?? [];
  next.lastPromotions = undefined;

  if (
    next.partnerCompetition &&
    next.competition.format === "league" &&
    next.competition.table &&
    next.partnerCompetition.table
  ) {
    const n = Math.min(
      PROMOTION_RELEGATION_COUNT,
      Math.floor(mainClubIds.length / 2),
      Math.floor(partnerClubIds.length / 2),
    );
    const mainSorted = sortTable(next.competition.table);
    const partnerSorted = sortTable(next.partnerCompetition.table);
    const relegatedIds = mainSorted.slice(-n).map((r) => r.clubId);
    const promotedIds = partnerSorted.slice(0, n).map((r) => r.clubId);

    const mainLeagueId = next.clubs[mainClubIds[0]]?.leagueId;
    const partnerLeagueId = next.clubs[partnerClubIds[0]]?.leagueId;
    for (const id of relegatedIds) {
      const club = next.clubs[id];
      if (club && partnerLeagueId) club.leagueId = partnerLeagueId;
    }
    for (const id of promotedIds) {
      const club = next.clubs[id];
      if (club && mainLeagueId) club.leagueId = mainLeagueId;
    }

    mainClubIds = [...mainClubIds.filter((id) => !relegatedIds.includes(id)), ...promotedIds];
    partnerClubIds = [...partnerClubIds.filter((id) => !promotedIds.includes(id)), ...relegatedIds];

    next.lastPromotions = [
      ...promotedIds.map((clubId) => ({ clubId, direction: "promoted" as const })),
      ...relegatedIds.map((clubId) => ({ clubId, direction: "relegated" as const })),
    ];
  }

  const startDay = next.day;
  const mainClubs = mainClubIds.map((id) => next.clubs[id]).filter((c): c is Club => !!c);
  const builtMain = rebuildLeagueOrTournament(next.competition, mainClubs, next.season);
  for (const f of builtMain.fixtures) f.day += startDay;
  for (const club of mainClubs) {
    const picked = sport.autoPickLineup(club, next.players);
    club.tactics.lineup = picked.lineup;
    club.tactics.bench = picked.bench;
  }

  let builtPartner: GameState["partnerCompetition"];
  if (next.partnerCompetition) {
    const partnerClubs = partnerClubIds.map((id) => next.clubs[id]).filter((c): c is Club => !!c);
    builtPartner = rebuildLeagueOrTournament(next.partnerCompetition, partnerClubs, next.season);
    for (const f of builtPartner.fixtures) f.day += startDay;
    for (const club of partnerClubs) {
      const picked = sport.autoPickLineup(club, next.players);
      club.tactics.lineup = picked.lineup;
      club.tactics.bench = picked.bench;
    }
  }

  // the user's club may have swapped tiers: keep `competition` pointed at whichever
  // division now contains it, so the rest of the game always treats it as "the" league
  const userInMain = mainClubIds.includes(next.manager.clubId);
  next.competition = userInMain ? builtMain : (builtPartner ?? builtMain);
  next.partnerCompetition = userInMain ? builtPartner : builtMain;

  next.rngState = rng.state();
  next.updatedAt = Date.now();
  return next;
}
