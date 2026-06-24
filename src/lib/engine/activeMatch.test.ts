import { describe, expect, it } from "vitest";
import { getSport } from "@/lib/sports";
import { getClubsForSport } from "@/data/clubs";
import { createNewGame } from "./newGame";
import { continueGame } from "./season";
import { advanceActiveMatch } from "./activeMatch";

describe("activeMatch: resumable segment-by-segment matches", () => {
  const sport = getSport("soccer");
  const club = getClubsForSport("soccer").find((c) => c.leagueId === "kor")!;

  function freshGame() {
    return createNewGame({
      sportId: "soccer",
      format: "league",
      leagueId: "kor",
      clubId: club.id,
      managerName: "Test Manager",
      locale: "ko",
    });
  }

  /** Advance the calendar until the engine pauses on the user's own fixture. */
  function pauseOnUserMatch() {
    let state = freshGame();
    let guard = 0;
    while (!state.activeMatch && !state.seasonOver && guard++ < 60) {
      state = continueGame(state, sport);
    }
    expect(state.activeMatch).toBeDefined();
    expect(state.activeMatch!.finished).toBe(false);
    return state;
  }

  it("continueGame pauses with an unfinished activeMatch and refuses to advance the calendar further", () => {
    const state = pauseOnUserMatch();
    expect(state.activeMatch!.phase).toBe("first_half");
    expect(state.activeMatch!.segments.length).toBe(0);

    const stuck = continueGame(state, sport);
    expect(stuck).toBe(state); // calendar doesn't move while a match is in progress
  });

  it("produces the same final result whether advanced straight through or with save/load round-trips between segments", () => {
    const base = pauseOnUserMatch();

    let straight = base;
    while (straight.activeMatch && !straight.activeMatch.finished) {
      straight = advanceActiveMatch(straight, sport);
    }

    let resumed = base;
    while (resumed.activeMatch && !resumed.activeMatch.finished) {
      // simulate persisting to and reloading from storage between each segment
      const roundTripped = JSON.parse(JSON.stringify(resumed));
      resumed = advanceActiveMatch(roundTripped, sport);
    }

    expect(resumed.activeMatch).toBeUndefined();
    expect(resumed.lastResultFixtureId).toBe(straight.lastResultFixtureId);
    expect(resumed.competition.fixtures).toEqual(straight.competition.fixtures);
    expect(resumed.rngState).toBe(straight.rngState);
  });

  it("finishes the match and resolves bookkeeping (news, form, press) once all segments are played", () => {
    let state = pauseOnUserMatch();
    let guard = 0;
    while (state.activeMatch && !state.activeMatch.finished && guard++ < 8) {
      state = advanceActiveMatch(state, sport);
    }
    expect(state.activeMatch).toBeUndefined();
    expect(state.lastResultFixtureId).toBeDefined();

    const fixture = state.competition.fixtures.find((f) => f.id === state.lastResultFixtureId);
    expect(fixture?.played).toBe(true);
    expect(fixture?.result).toBeDefined();

    const myClub = state.clubs[state.manager.clubId];
    const withForm = myClub.squad.map((id) => state.players[id]).filter((p) => (p.recentForm ?? []).length > 0);
    expect(withForm.length).toBeGreaterThan(0);
    expect((state.press ?? []).length).toBeGreaterThanOrEqual(1);
  });
});
