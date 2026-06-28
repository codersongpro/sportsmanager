import type { ActiveMatchState, Fixture, GameState, SimOptions, SportModule } from "@/lib/types";
import { createRng } from "@/lib/sim/rng";
import { resolveTeam, finishMatch } from "./matchFlow";

type MatchScope = "domestic" | "worldcup" | "clubcup";

/** Build the initial (unplayed) state for a user fixture that's about to be played out segment by segment. */
export function beginActiveMatch(
  state: GameState,
  fixture: Fixture,
  sport: SportModule,
  scope: MatchScope = "domestic",
): ActiveMatchState {
  // International knockout/group fixtures are always single-leg, neutral-venue, no-draw,
  // matching `simulateTournamentStage`'s atomic-simulation semantics in worldcup.ts.
  const opts: SimOptions =
    scope === "domestic"
      ? { allowDraw: state.competition.format === "league", neutralVenue: state.competition.kind === "national" }
      : { allowDraw: false, neutralVenue: true };
  return {
    fixtureId: fixture.id,
    day: fixture.day,
    homeId: fixture.homeId,
    awayId: fixture.awayId as string,
    scope,
    opts,
    phase: sport.firstSegment?.(opts) ?? "first_half",
    finished: false,
    homeScore: 0,
    awayScore: 0,
    segments: [],
    subsMade: 0,
    subbedOffIds: [],
    teamTalkGiven: false,
  };
}

/**
 * Simulate the next segment of the currently active match, mutating a deep
 * copy of `state` and returning it. When the match concludes, this also
 * performs all of the usual post-match bookkeeping (`finishMatch`) and
 * clears `state.activeMatch`. Sports that don't implement segment
 * simulation fall back to resolving the whole match in one step.
 */
export function advanceActiveMatch(state: GameState, sport: SportModule): GameState {
  const active = state.activeMatch;
  if (!active || active.finished) return state;

  const next: GameState = structuredClone(state);
  const nextActive = next.activeMatch!;
  const scope: MatchScope = nextActive.scope ?? "domestic";
  const rng = createRng(next.rngState);

  // Club Cup entrants are existing domestic clubs (shared `clubs` registry); the World Cup
  // uses a separate nation registry/competition; domestic fixtures use the main competition.
  const clubsMap = scope === "worldcup" ? next.worldCup!.clubs : next.clubs;
  const comp = scope === "worldcup" ? next.worldCup!.competition : scope === "clubcup" ? next.clubCup!.competition : next.competition;

  const home = clubsMap[nextActive.homeId];
  const away = clubsMap[nextActive.awayId];
  const homeTeam = resolveTeam(home, next.players, sport);
  const awayTeam = resolveTeam(away, next.players, sport);

  const markFinished = () => {
    if (scope !== "domestic") {
      next.lastResultFixtureId = nextActive.fixtureId;
      next.lastResultScope = scope;
    }
    next.activeMatch = undefined;
  };

  if (sport.simulateSegment && sport.finalizeSegments) {
    const kind = nextActive.phase;
    const result = sport.simulateSegment(homeTeam, awayTeam, rng, kind, nextActive.opts);
    nextActive.segments.push({ kind, result });
    nextActive.homeScore += result.homeGoals;
    nextActive.awayScore += result.awayGoals;

    const upcoming = sport.nextSegment?.(kind, nextActive.homeScore, nextActive.awayScore, nextActive.opts) ?? null;
    if (upcoming) {
      nextActive.phase = upcoming;
    } else {
      const finalResult = sport.finalizeSegments(homeTeam, awayTeam, nextActive.segments, nextActive.opts, rng);
      finalResult.fixtureId = nextActive.fixtureId;
      nextActive.finished = true;
      nextActive.finalResult = finalResult;
      finishMatch(next, comp, nextActive.fixtureId, home, away, homeTeam, awayTeam, finalResult);
      markFinished();
    }
  } else {
    // sport doesn't support segmentation: resolve atomically in one go
    const finalResult = sport.simulateMatch(homeTeam, awayTeam, rng, nextActive.opts);
    finalResult.fixtureId = nextActive.fixtureId;
    nextActive.finished = true;
    nextActive.finalResult = finalResult;
    nextActive.homeScore = finalResult.homeScore;
    nextActive.awayScore = finalResult.awayScore;
    finishMatch(next, comp, nextActive.fixtureId, home, away, homeTeam, awayTeam, finalResult);
    markFinished();
  }

  next.rngState = rng.state();
  next.updatedAt = Date.now();
  return next;
}
