import type { ActiveMatchState, Fixture, GameState, MatchSegmentKind, SimOptions, SportModule } from "@/lib/types";
import { createRng } from "@/lib/sim/rng";
import { resolveTeam, finishMatch } from "./matchFlow";

/** Build the initial (unplayed) state for a user fixture that's about to be played out segment by segment. */
export function beginActiveMatch(state: GameState, fixture: Fixture): ActiveMatchState {
  const comp = state.competition;
  const opts: SimOptions = {
    allowDraw: comp.format === "league",
    neutralVenue: comp.kind === "national",
  };
  return {
    fixtureId: fixture.id,
    day: fixture.day,
    homeId: fixture.homeId,
    awayId: fixture.awayId as string,
    opts,
    phase: "first_half",
    finished: false,
    homeScore: 0,
    awayScore: 0,
    segments: [],
    subsMade: 0,
    subbedOffIds: [],
    teamTalkGiven: false,
  };
}

/** Decide which segment comes after the one just played, given the running score and the match's options. */
function nextPhase(kind: MatchSegmentKind, homeScore: number, awayScore: number, opts: SimOptions): MatchSegmentKind | null {
  const level = homeScore === awayScore;
  if (kind === "first_half") return "second_half";
  if (kind === "second_half") return !opts.allowDraw && level ? "extra_time" : null;
  if (kind === "extra_time") return level ? "penalties" : null;
  return null; // penalties always finishes
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
  const rng = createRng(next.rngState);

  const home = next.clubs[nextActive.homeId];
  const away = next.clubs[nextActive.awayId];
  const homeTeam = resolveTeam(home, next.players, sport);
  const awayTeam = resolveTeam(away, next.players, sport);

  if (sport.simulateSegment && sport.finalizeSegments) {
    const kind = nextActive.phase;
    const result = sport.simulateSegment(homeTeam, awayTeam, rng, kind, nextActive.opts);
    nextActive.segments.push({ kind, result });
    nextActive.homeScore += result.homeGoals;
    nextActive.awayScore += result.awayGoals;

    const upcoming = nextPhase(kind, nextActive.homeScore, nextActive.awayScore, nextActive.opts);
    if (upcoming) {
      nextActive.phase = upcoming;
    } else {
      const finalResult = sport.finalizeSegments(homeTeam, awayTeam, nextActive.segments, nextActive.opts, rng);
      finalResult.fixtureId = nextActive.fixtureId;
      nextActive.finished = true;
      nextActive.finalResult = finalResult;
      finishMatch(next, next.competition, nextActive.fixtureId, home, away, homeTeam, awayTeam, finalResult);
      next.activeMatch = undefined;
    }
  } else {
    // sport doesn't support segmentation: resolve atomically in one go
    const finalResult = sport.simulateMatch(homeTeam, awayTeam, rng, nextActive.opts);
    finalResult.fixtureId = nextActive.fixtureId;
    nextActive.finished = true;
    nextActive.finalResult = finalResult;
    nextActive.homeScore = finalResult.homeScore;
    nextActive.awayScore = finalResult.awayScore;
    finishMatch(next, next.competition, nextActive.fixtureId, home, away, homeTeam, awayTeam, finalResult);
    next.activeMatch = undefined;
  }

  next.rngState = rng.state();
  next.updatedAt = Date.now();
  return next;
}
