import type { Club, CompetitionState, GameState, MatchResult, MatchTeam, NewsItem, Player, SportModule } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { recordResult } from "./competition";
import { makePostMatchPress } from "./press";

/** Resolve a club's matchday XI, falling back to an auto-pick if the saved lineup is incomplete or has injured players. */
export function resolveTeam(club: Club, players: Record<string, Player>, sport: SportModule, day: number): MatchTeam {
  const healthy = (id: string) => {
    const p = players[id];
    return !!p && !(p.injuredUntilDay != null && p.injuredUntilDay > day);
  };
  let ids = club.tactics.lineup.filter(healthy);
  if (ids.length < 11) {
    const eligible = Object.fromEntries(Object.entries(players).filter(([id]) => !club.squad.includes(id) || healthy(id)));
    ids = sport.autoPickLineup(club, eligible).lineup.filter(healthy);
    if (ids.length < club.tactics.lineup.length) ids = sport.autoPickLineup(club, players).lineup; // mass-injury fallback: field who we can
  }
  return { club, lineup: ids.map((id) => players[id]) };
}

export function pushNews(state: GameState, title: NewsItem["title"], body?: NewsItem["body"]) {
  state.news.unshift({ id: `n${state.day}_${state.news.length}`, day: state.day, title, body, read: false });
  if (state.news.length > 200) state.news.length = 200;
}

export function bumpApps(players: Record<string, Player>, id: string) {
  const p = players[id];
  if (p) p.apps = (p.apps ?? 0) + 1;
}

/** Record a match into each lineup player's recent-form history (last 6). */
export function recordForm(
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

    const avg = form.reduce((s, e) => s + e.rating, 0) / form.length;
    p.form = Math.max(-5, Math.min(5, Math.round((avg - 6.5) * 2.2)));
  }
}

export function outcomeFor(forHome: boolean, r: MatchResult): "W" | "D" | "L" {
  const mine = forHome ? r.homeScore : r.awayScore;
  const theirs = forHome ? r.awayScore : r.homeScore;
  if (mine > theirs) return "W";
  if (mine < theirs) return "L";
  return "D";
}

/** Manager reputation drifts with results; upsets count for more. */
export function applyManagerRep(state: GameState, outcome: "W" | "D" | "L", myRep: number, oppRep: number) {
  let delta = 0;
  if (outcome === "W") delta = 1 + Math.max(0, oppRep - myRep) / 18;
  else if (outcome === "L") delta = -1 - Math.max(0, myRep - oppRep) / 24;
  else delta = (oppRep - myRep) / 40;
  state.manager.reputation = Math.max(1, Math.min(99, Math.round((state.manager.reputation + delta) * 10) / 10));
}

/** A club's outcomes in this competition, most recent first, up to `count` played fixtures. */
function clubRecentOutcomes(comp: CompetitionState, clubId: string, count: number): ("W" | "D" | "L")[] {
  return comp.fixtures
    .filter((f) => f.played && f.result && (f.homeId === clubId || f.awayId === clubId))
    .sort((a, b) => b.day - a.day)
    .slice(0, count)
    .map((f) => outcomeFor(f.homeId === clubId, f.result!));
}

/** Apply the post-match morale delta (result + 3-game streak bonus) to a club's full squad. */
function applyMoraleForResult(state: GameState, comp: CompetitionState, club: Club, outcome: "W" | "D" | "L") {
  const recent = clubRecentOutcomes(comp, club.id, 3);
  let streakBonus = 0;
  if (recent.length === 3) {
    if (recent.every((o) => o === "W")) streakBonus = 2;
    else if (recent.every((o) => o === "L")) streakBonus = -2;
  }
  const delta = (outcome === "W" ? 4 : outcome === "L" ? -4 : 0) + streakBonus;
  for (const id of club.squad) {
    const p = state.players[id];
    if (p) p.morale = Math.max(0, Math.min(100, p.morale + delta));
  }
}

/**
 * Post-match player state update (condition/morale/injury). Called exactly
 * once per domestic match on both the atomic AI path and the segment-by-
 * segment user path (via `finishMatch`), plus once per partner-division
 * match, so every player in the league is kept in sync.
 */
export function applyPostMatchPlayerEffects(
  state: GameState,
  comp: CompetitionState,
  homeTeam: MatchTeam,
  awayTeam: MatchTeam,
  result: MatchResult,
  day: number,
  rng: RNG,
) {
  for (const p of [...homeTeam.lineup, ...awayTeam.lineup]) {
    const cost = Math.min(32, Math.max(16, 19 + (p.age - 23) * 0.7));
    p.condition = Math.max(5, Math.min(100, p.condition - cost));
  }

  applyMoraleForResult(state, comp, homeTeam.club, outcomeFor(true, result));
  applyMoraleForResult(state, comp, awayTeam.club, outcomeFor(false, result));

  const userClubId = state.manager.clubId;
  for (const event of result.events) {
    if (event.type !== "injury" || !event.playerId) continue;
    const p = state.players[event.playerId];
    if (!p) continue;
    const days = 4 + rng.int(0, 17); // 4-21 days
    p.injuredUntilDay = day + days;
    p.condition = Math.max(30, p.condition - 25);
    if (p.clubId === userClubId) {
      const name = p.nameKo ?? p.name;
      pushNews(state, { ko: `${name} 부상 (약 ${days}일 결장)`, en: `${p.name} injured (~${days} days out)` });
    }
  }
}

/**
 * Apply the full set of bookkeeping that follows a resolved `MatchResult`:
 * record it into the competition table/bracket, bump appearances, record
 * player form, post a news item, and (if it's the user's own fixture) set
 * `lastResultFixtureId`, drift manager reputation, and queue a press item.
 * Used by both the atomic AI-match path (`playMatchesForDay`) and the
 * segment-by-segment user-match path (`activeMatch.ts`), so both always
 * agree on what "finishing a match" means.
 */
export function finishMatch(
  state: GameState,
  comp: CompetitionState,
  fixtureId: string,
  home: Club,
  away: Club,
  homeTeam: MatchTeam,
  awayTeam: MatchTeam,
  result: MatchResult,
  rng: RNG,
) {
  recordResult(comp, result);

  for (const p of homeTeam.lineup) bumpApps(state.players, p.id);
  for (const p of awayTeam.lineup) bumpApps(state.players, p.id);

  recordForm(state.players, homeTeam.lineup.map((p) => p.id), result.playerRatings, away.shortName, outcomeFor(true, result), result.homeScore, result.awayScore, state.day);
  recordForm(state.players, awayTeam.lineup.map((p) => p.id), result.playerRatings, home.shortName, outcomeFor(false, result), result.awayScore, result.homeScore, state.day);

  // Only the domestic competition drives player condition/morale/injury state;
  // World Cup / Club Cup AI-side matches resolve atomically through worldcup.ts
  // and never touch these fields, so applying them here too would only tire
  // out the user's own squad asymmetrically.
  if (comp.id === state.competition.id) {
    applyPostMatchPlayerEffects(state, comp, homeTeam, awayTeam, result, state.day, rng);
  }

  pushNews(state, {
    ko: `${home.nameKo ?? home.name} ${result.homeScore} - ${result.awayScore} ${away.nameKo ?? away.name}`,
    en: `${home.name} ${result.homeScore} - ${result.awayScore} ${away.name}`,
  });

  const userIsHome = home.id === state.manager.clubId;
  if (userIsHome || away.id === state.manager.clubId) {
    state.lastResultFixtureId = fixtureId;
    const outcome = outcomeFor(userIsHome, result);
    const oppShort = userIsHome ? away.shortName : home.shortName;
    applyManagerRep(state, outcome, userIsHome ? home.reputation : away.reputation, userIsHome ? away.reputation : home.reputation);
    const press = (state.press ??= []);
    press.push(makePostMatchPress(`press_${state.day}_${fixtureId}`, state.day, outcome, oppShort));
    if (press.length > 12) press.splice(0, press.length - 12);
  }
}
