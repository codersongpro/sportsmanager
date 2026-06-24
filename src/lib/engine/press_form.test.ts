import { describe, it, expect } from "vitest";
import { createNewGame } from "./newGame";
import { continueGame } from "./season";
import { advanceActiveMatch } from "./activeMatch";
import { getSport } from "@/lib/sports";
import { CLUBS } from "@/data/clubs";

describe("season: form history, press and manager reputation", () => {
  it("records form, queues a press item and moves manager reputation after a user match", () => {
    const club = CLUBS.find((c) => c.leagueId === "eng")!;
    let state = createNewGame({
      sportId: "soccer",
      format: "league",
      leagueId: "eng",
      clubId: club.id,
      managerName: "테스터",
      locale: "ko",
      startSeason: 2026,
    });
    const sport = getSport("soccer");

    // advance until the user has played at least one match
    let guard = 0;
    while (!state.lastResultFixtureId && guard++ < 20) {
      state = continueGame(state, sport);
      let drain = 0;
      while (state.activeMatch && !state.activeMatch.finished && drain++ < 8) {
        state = advanceActiveMatch(state, sport);
      }
    }
    expect(state.lastResultFixtureId).toBeTruthy();

    // a press conference is queued
    expect((state.press ?? []).length).toBeGreaterThanOrEqual(1);
    const item = state.press![0];
    expect(item.options.length).toBe(3);

    // at least one player in the user squad has recorded form
    const myClub = state.clubs[state.manager.clubId];
    const withForm = myClub.squad.map((id) => state.players[id]).filter((p) => (p.recentForm ?? []).length > 0);
    expect(withForm.length).toBeGreaterThan(0);

    // reputation has drifted from the starting value
    expect(state.manager.reputation).not.toBe(50);
  });
});
