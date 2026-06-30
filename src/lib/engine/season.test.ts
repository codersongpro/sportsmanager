import { describe, expect, it } from "vitest";
import { getSport } from "@/lib/sports";
import { getClubsForSport } from "@/data/clubs";
import type { GameState, SportModule } from "@/lib/types";
import { advanceActiveMatch } from "./activeMatch";
import { createNewGame } from "./newGame";
import { continueGame, rolloverSeason } from "./season";

/** continueGame pauses on the user's own fixture (`activeMatch`); drain it to mirror the store's auto-play. */
function continueAndDrain(state: GameState, sport: SportModule): GameState {
  let next = continueGame(state, sport);
  let guard = 0;
  while (next.activeMatch && !next.activeMatch.finished && guard++ < 8) {
    next = advanceActiveMatch(next, sport);
  }
  return next;
}

describe("season engine", () => {
  const sport = getSport("soccer");
  const korClub = getClubsForSport("soccer").find((c) => c.leagueId === "kor")!;

  function freshGame() {
    return createNewGame({
      sportId: "soccer",
      format: "league",
      leagueId: "kor",
      clubId: korClub.id,
      managerName: "Test Manager",
      locale: "ko",
    });
  }

  it("advances the calendar and stops on the user's own fixture", () => {
    let state = freshGame();
    let guard = 0;
    while (!state.lastResultFixtureId && !state.seasonOver && guard++ < 60) {
      state = continueAndDrain(state, sport);
    }
    expect(state.lastResultFixtureId).toBeDefined();
    const fixture = state.competition.fixtures.find((f) => f.id === state.lastResultFixtureId);
    expect(fixture?.played).toBe(true);
    expect(fixture?.result).toBeDefined();
    expect([fixture?.homeId, fixture?.awayId]).toContain(state.manager.clubId);
  });

  // Simulates a whole season match-by-match, so it needs more than the default
  // 5s, especially under parallel-suite CPU load.
  it("completes the league and rolls into a fresh season", () => {
    let state = freshGame();
    let guard = 0;
    while (!state.seasonOver && guard++ < 200) {
      state = continueAndDrain(state, sport);
    }
    expect(state.seasonOver).toBe(true);
    expect(state.competition.championId).toBeTruthy();
    expect(state.competition.fixtures.every((f) => f.played)).toBe(true);

    const startSeason = state.season;
    const rolled = rolloverSeason(state, sport);
    expect(rolled.season).toBe(startSeason + 1);
    expect(rolled.seasonOver).toBe(false);
    expect(rolled.competition.championId).toBeFalsy();
    expect(rolled.competition.fixtures.every((f) => !f.played)).toBe(true);
    // players aged by one year and reset apps for the new season
    const anyPlayerId = Object.keys(state.players)[0];
    expect(rolled.players[anyPlayerId].age).toBe(state.players[anyPlayerId].age + 1);
    expect(rolled.players[anyPlayerId].apps).toBe(0);
  }, 30000);
});
