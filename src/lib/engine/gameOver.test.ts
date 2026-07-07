import { describe, expect, it } from "vitest";
import { getSport } from "@/lib/sports";
import { getClubsForSport } from "@/data/clubs";
import { createNewGame } from "./newGame";
import { continueGame, rolloverSeason } from "./season";
import { checkSacking } from "./matchFlow";

describe("board sacking (checkSacking + gameOver guards)", () => {
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

  function markFixturesPlayed(state: ReturnType<typeof freshGame>, count: number) {
    const myClubId = state.manager.clubId;
    let marked = 0;
    for (const f of state.competition.fixtures) {
      if (marked >= count) break;
      if (f.homeId === myClubId || f.awayId === myClubId) {
        f.played = true;
        marked++;
      }
    }
  }

  it("does not sack while confidence is still >= 15", () => {
    const state = freshGame();
    markFixturesPlayed(state, 6);
    state.board = { objectiveRank: 3, confidence: 20 };
    checkSacking(state);
    expect(state.gameOver).toBeUndefined();
  });

  it("does not sack before the 6-match grace period this season", () => {
    const state = freshGame();
    markFixturesPlayed(state, 5);
    state.board = { objectiveRank: 3, confidence: 10 };
    checkSacking(state);
    expect(state.gameOver).toBeUndefined();
  });

  it("sacks the manager once confidence drops below 15 after the grace period", () => {
    const state = freshGame();
    markFixturesPlayed(state, 6);
    state.board = { objectiveRank: 3, confidence: 10 };
    checkSacking(state);
    expect(state.gameOver).toEqual({ reason: "sacked", day: state.day, season: state.season });
    expect(state.news.some((n) => n.id.startsWith(`n${state.day}_`))).toBe(true);
  });

  it("is idempotent: does not re-sack or overwrite an existing gameOver", () => {
    const state = freshGame();
    markFixturesPlayed(state, 6);
    state.board = { objectiveRank: 3, confidence: 10 };
    checkSacking(state);
    const first = state.gameOver;
    state.day += 10;
    checkSacking(state);
    expect(state.gameOver).toEqual(first);
  });

  it("continueGame halts once gameOver is set", () => {
    const state = freshGame();
    state.gameOver = { reason: "sacked", day: state.day, season: state.season };
    const next = continueGame(state, sport);
    expect(next).toBe(state);
  });

  it("rolloverSeason halts once gameOver is set", () => {
    const state = freshGame();
    state.gameOver = { reason: "sacked", day: state.day, season: state.season };
    const next = rolloverSeason(state, sport);
    expect(next).toBe(state);
  });
});
