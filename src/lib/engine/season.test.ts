import { describe, expect, it } from "vitest";
import { getSport } from "@/lib/sports";
import { CLUBS } from "@/data/clubs";
import { createNewGame } from "./newGame";
import { continueGame, rolloverSeason } from "./season";

describe("season engine", () => {
  const sport = getSport("soccer");
  const korClub = CLUBS.find((c) => c.leagueId === "kor")!;

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
      state = continueGame(state, sport);
    }
    expect(state.lastResultFixtureId).toBeDefined();
    const fixture = state.competition.fixtures.find((f) => f.id === state.lastResultFixtureId);
    expect(fixture?.played).toBe(true);
    expect(fixture?.result).toBeDefined();
    expect([fixture?.homeId, fixture?.awayId]).toContain(state.manager.clubId);
  });

  it("completes the league and rolls into a fresh season", () => {
    let state = freshGame();
    let guard = 0;
    while (!state.seasonOver && guard++ < 200) {
      state = continueGame(state, sport);
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
  });
});
