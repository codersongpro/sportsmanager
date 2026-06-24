import type { Club, CompetitionState, GameState, MatchResult, MatchTeam, NewsItem, Player, SportModule } from "@/lib/types";
import { recordResult } from "./competition";
import { makePostMatchPress } from "./press";

/** Resolve a club's matchday XI, falling back to an auto-pick if the saved lineup is incomplete. */
export function resolveTeam(club: Club, players: Record<string, Player>, sport: SportModule): MatchTeam {
  let ids = club.tactics.lineup.filter((id) => players[id]);
  if (ids.length < 11) {
    ids = sport.autoPickLineup(club, players).lineup;
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
) {
  recordResult(comp, result);

  for (const p of homeTeam.lineup) bumpApps(state.players, p.id);
  for (const p of awayTeam.lineup) bumpApps(state.players, p.id);

  recordForm(state.players, homeTeam.lineup.map((p) => p.id), result.playerRatings, away.shortName, outcomeFor(true, result), result.homeScore, result.awayScore, state.day);
  recordForm(state.players, awayTeam.lineup.map((p) => p.id), result.playerRatings, home.shortName, outcomeFor(false, result), result.awayScore, result.homeScore, state.day);

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
