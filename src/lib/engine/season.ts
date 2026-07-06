import type { Club, GameState, Player, SimOptions, SportModule } from "@/lib/types";
import { createRng, type RNG } from "@/lib/sim/rng";
import { createLeague, createTournament, isComplete, recordResult, sortTable } from "./competition";
import { beginActiveMatch } from "./activeMatch";
import { applyPostMatchPlayerEffects, bumpApps, checkSacking, finishMatch, outcomeFor, pushNews, recordForm, resolveTeam } from "./matchFlow";
import { weeklyIncomeFor } from "./finance";

const WEEK = 7;
// Safety cap on how many calendar days a single "continue" can advance through
// (covers a full season with no scheduled fixture for the user's club for a
// while, e.g. early tournament byes) without ever looping forever.
const MAX_DAYS_PER_CONTINUE = 400;
// how many clubs swap tiers at season rollover (out of 8-club leagues)
export const PROMOTION_RELEGATION_COUNT = 2;

/**
 * The board's season objective for the user's club: how their reputation
 * ranks among the competition's clubs sets an ambition level (top-2 reputation
 * -> title challenge, bottom-2 -> avoid relegation, otherwise one place above
 * their reputation rank).
 */
export function computeBoardObjective(clubIds: string[], clubs: Record<string, Club>, myClubId: string): number {
  const N = clubIds.length;
  const sorted = [...clubIds].sort((a, b) => {
    const repDiff = (clubs[b]?.reputation ?? 0) - (clubs[a]?.reputation ?? 0);
    return repDiff !== 0 ? repDiff : a.localeCompare(b);
  });
  const repRank = sorted.indexOf(myClubId) + 1;
  if (repRank <= 2) return 2;
  if (repRank >= N - 1) return Math.max(1, N - PROMOTION_RELEGATION_COUNT);
  return repRank + 1;
}

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

/** Force-sells the user's highest-value squad player at 80% of value to cover sustained debt. */
function forceSale(state: GameState, club: Club) {
  const candidates = club.squad.map((id) => state.players[id]).filter((p): p is Player => !!p);
  if (candidates.length === 0) return;
  const target = [...candidates].sort((a, b) => b.value - a.value || a.id.localeCompare(b.id))[0];
  const fee = Math.round(target.value * 0.8);
  club.finances.balance += fee;
  club.squad = club.squad.filter((id) => id !== target.id);
  club.tactics.lineup = club.tactics.lineup.filter((id) => id !== target.id);
  club.tactics.bench = club.tactics.bench.filter((id) => id !== target.id);
  state.players[target.id] = { ...target, clubId: null };
  const name = target.nameKo ?? target.name;
  pushNews(state, { ko: `이사회가 강제 매각을 단행했습니다: ${name}`, en: `The board forced a sale: ${target.name}` });
}

function processWeeklyFinances(state: GameState) {
  const userClubId = state.manager.clubId;
  for (const club of Object.values(state.clubs)) {
    if (club.isNational) continue;
    const wageBill = club.squad.reduce((s, id) => s + (state.players[id]?.wage ?? 0), 0);
    const income = weeklyIncomeFor(club, wageBill);
    club.finances.balance += income - wageBill;

    if (club.id === userClubId) {
      club.finances.debtWeeks = club.finances.balance < 0 ? (club.finances.debtWeeks ?? 0) + 1 : 0;
      if (club.finances.debtWeeks === 2) {
        pushNews(state, { ko: "재정 경고: 잔고가 2주 연속 마이너스입니다", en: "Financial warning: balance has been negative for 2 weeks" });
        if (state.board) state.board.confidence = Math.max(0, state.board.confidence - 5);
      } else if (club.finances.debtWeeks >= 4) {
        forceSale(state, club);
        club.finances.debtWeeks = 2;
        if (state.board) state.board.confidence = Math.max(0, state.board.confidence - 10);
      }
    }
  }
  checkSacking(state);
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

/** Weekly morale decay (every player drifts 10% toward a neutral baseline) and board confidence convergence toward its objective-based anchor. */
function processWeeklyUpkeep(state: GameState) {
  for (const id in state.players) {
    const p = state.players[id];
    p.morale = Math.round((p.morale + (55 - p.morale) * 0.1) * 10) / 10;
  }

  if (state.board && state.competition.format === "league" && state.competition.table) {
    const rank = sortTable(state.competition.table).findIndex((r) => r.clubId === state.manager.clubId) + 1;
    if (rank > 0) {
      const anchor = Math.max(5, Math.min(95, 62 + (state.board.objectiveRank - rank) * 7));
      state.board.confidence = Math.round(Math.max(0, Math.min(100, state.board.confidence + (anchor - state.board.confidence) * 0.2)) * 10) / 10;
    }
  }
  checkSacking(state);
}

/**
 * Runs exactly once, the moment a competition completes: the board's
 * season-end verdict (±15 confidence vs the objective), prize money for every
 * club, and the season's honours (champion / top scorer / MVP), appended to
 * `state.honours` so they survive the next rollover.
 */
function finalizeSeasonRewards(state: GameState, sport: SportModule) {
  const comp = state.competition;
  const N = comp.clubIds.length;

  if (state.board && comp.format === "league" && comp.table) {
    const finalRank = sortTable(comp.table).findIndex((r) => r.clubId === state.manager.clubId) + 1;
    if (finalRank > 0) {
      if (finalRank <= state.board.objectiveRank) {
        state.board.confidence = Math.min(95, state.board.confidence + 15);
        pushNews(state, { ko: "이사회가 시즌 성과에 만족합니다", en: "The board is pleased with the season" });
      } else {
        state.board.confidence = Math.max(0, state.board.confidence - 15);
        pushNews(state, { ko: "이사회가 시즌 성과에 실망했습니다", en: "The board is disappointed with the season" });
      }
    }
  }

  if (comp.format === "league" && comp.table) {
    sortTable(comp.table).forEach((row, i) => {
      const club = state.clubs[row.clubId];
      if (!club || club.isNational) return;
      const r = i + 1;
      let prize = Math.round((3_000_000 * (N - r)) / (N - 1) + 500_000);
      if (r === 1) prize += 1_000_000;
      club.finances.balance += prize;
      club.finances.transferBudget += Math.round(prize * 0.5);
      if (club.id === state.manager.clubId) {
        pushNews(state, { ko: `시즌 상금 ${prize.toLocaleString()}원을 받았습니다`, en: `Received ${prize.toLocaleString()} in prize money` });
      }
    });
  } else if (comp.format === "tournament" && comp.bracket && comp.bracket.length > 0) {
    const finalMatch = comp.bracket[comp.bracket.length - 1].matches[0];
    const runnerUpId = finalMatch?.winnerId
      ? finalMatch.homeId === finalMatch.winnerId
        ? finalMatch.awayId
        : finalMatch.homeId
      : null;
    if (comp.championId) {
      const champ = state.clubs[comp.championId];
      if (champ && !champ.isNational) {
        champ.finances.balance += 3_000_000;
        champ.finances.transferBudget += 1_500_000;
        if (champ.id === state.manager.clubId) pushNews(state, { ko: "우승 상금 3,000,000원을 받았습니다", en: "Received 3,000,000 as champions" });
      }
    }
    if (runnerUpId) {
      const runnerUp = state.clubs[runnerUpId];
      if (runnerUp && !runnerUp.isNational) {
        runnerUp.finances.balance += 1_200_000;
        runnerUp.finances.transferBudget += 600_000;
        if (runnerUp.id === state.manager.clubId) pushNews(state, { ko: "준우승 상금 1,200,000원을 받았습니다", en: "Received 1,200,000 as runners-up" });
      }
    }
  }

  const scoringTypes = sport.scoringEventTypes ?? [{ type: "goal", points: 1 }];
  const pointsByPlayer = new Map<string, number>();
  const ratingSum = new Map<string, number>();
  const ratingCount = new Map<string, number>();
  for (const fixture of comp.fixtures) {
    if (!fixture.played || !fixture.result) continue;
    for (const event of fixture.result.events) {
      if (!event.playerId) continue;
      const scoring = scoringTypes.find((s) => s.type === event.type);
      if (scoring) pointsByPlayer.set(event.playerId, (pointsByPlayer.get(event.playerId) ?? 0) + scoring.points);
    }
    for (const [playerId, rating] of Object.entries(fixture.result.playerRatings)) {
      ratingSum.set(playerId, (ratingSum.get(playerId) ?? 0) + rating);
      ratingCount.set(playerId, (ratingCount.get(playerId) ?? 0) + 1);
    }
  }

  let topScorer: { playerId: string; name: string; count: number } | undefined;
  const scorerEntries = [...pointsByPlayer.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (scorerEntries.length > 0) {
    const [playerId, count] = scorerEntries[0];
    const p = state.players[playerId];
    if (p) topScorer = { playerId, name: p.nameKo ?? p.name, count };
  }

  let mvp: { playerId: string; name: string; avgRating: number } | undefined;
  const mvpEntries = [...ratingCount.entries()]
    .filter(([, count]) => count >= 5)
    .map(([playerId, count]) => [playerId, (ratingSum.get(playerId) ?? 0) / count] as [string, number])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (mvpEntries.length > 0) {
    const [playerId, avgRating] = mvpEntries[0];
    const p = state.players[playerId];
    if (p) mvp = { playerId, name: p.nameKo ?? p.name, avgRating: Math.round(avgRating * 100) / 100 };
  }

  const userRank = comp.format === "league" && comp.table ? sortTable(comp.table).findIndex((r) => r.clubId === state.manager.clubId) + 1 || null : null;

  const honours = (state.honours ??= []);
  honours.push({ season: state.season, competitionName: comp.name, championId: comp.championId ?? "", userRank, topScorer, mvp });
  if (honours.length > 20) honours.splice(0, honours.length - 20);

  if (comp.championId) {
    const champ = state.clubs[comp.championId];
    if (champ) pushNews(state, { ko: `${champ.nameKo ?? champ.name} 우승!`, en: `${champ.name} are champions!` });
  }
  if (topScorer) pushNews(state, { ko: `득점왕: ${topScorer.name} (${topScorer.count})`, en: `Top scorer: ${topScorer.name} (${topScorer.count})` });
  if (mvp) pushNews(state, { ko: `시즌 MVP: ${mvp.name}`, en: `Season MVP: ${mvp.name}` });

  checkSacking(state);
}

/**
 * Advance the calendar until the next event relevant to the user: their own
 * fixture is played, or the competition concludes. Mutates a deep copy of
 * `state` and returns it; the RNG resumes exactly where it left off via the
 * serialized `rngState`.
 */
export function continueGame(state: GameState, sport: SportModule): GameState {
  if (state.seasonOver || state.gameOver) return state;
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

  if (isComplete(next.competition)) {
    next.seasonOver = true;
    finalizeSeasonRewards(next, sport);
  }
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
  if (state.gameOver) return state;
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

    for (const clubId of promotedIds) {
      const club = next.clubs[clubId];
      if (club) club.finances.balance += 2_000_000;
    }
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

  next.board = {
    objectiveRank: computeBoardObjective(next.competition.clubIds, next.clubs, next.manager.clubId),
    confidence: next.board?.confidence ?? 60,
  };

  next.rngState = rng.state();
  next.updatedAt = Date.now();
  return next;
}
