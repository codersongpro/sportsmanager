import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/sim/rng";
import { getSport } from "@/lib/sports";
import { getClubsForSport } from "@/data/clubs";
import { buildWorld } from "./world";
import { createLeague, createTournament, isComplete, recordResult, sortTable, upcomingFixtures } from "./competition";

const sport = getSport("soccer");

function smallClubs(leagueId: string, world: ReturnType<typeof buildWorld>) {
  return getClubsForSport("soccer").filter((c) => c.leagueId === leagueId).map((c) => world.clubs[c.id]);
}

describe("competition engine", () => {
  const rng = createRng(123);
  const world = buildWorld(sport, rng, 2026);

  it("league: applying every result fills the table and crowns a champion", () => {
    const clubs = smallClubs("eng", world);
    const league = createLeague("eng-test", { ko: "테스트", en: "Test" }, "EN", clubs, 2026);
    expect(league.fixtures.length).toBe(clubs.length * (clubs.length - 1)); // double round-robin

    for (const fixture of league.fixtures) {
      const home = world.clubs[fixture.homeId];
      const away = world.clubs[fixture.awayId!];
      const result = sport.simulateMatch(
        { club: home, lineup: home.tactics.lineup.map((id) => world.players[id]) },
        { club: away, lineup: away.tactics.lineup.map((id) => world.players[id]) },
        rng,
        { allowDraw: true },
      );
      result.fixtureId = fixture.id;
      recordResult(league, result);
    }

    expect(isComplete(league)).toBe(true);
    expect(upcomingFixtures(league).length).toBe(0);
    const table = sortTable(league.table!);
    const totalPlayed = table.reduce((s, r) => s + r.played, 0);
    expect(totalPlayed).toBe(league.fixtures.length * 2);
    expect(league.championId).toBe(table[0].clubId);
  });

  it("tournament: playing every round resolves to a single champion", () => {
    const clubs = smallClubs("kor", world); // 8 clubs -> clean power of two
    const tourney = createTournament("kor-test", { ko: "테스트", en: "Test" }, "KR", "club", clubs, 2026);

    let guard = 0;
    while (!isComplete(tourney) && guard++ < 20) {
      const pending = tourney.fixtures.filter((f) => !f.played);
      for (const fixture of pending) {
        const home = world.clubs[fixture.homeId];
        const away = world.clubs[fixture.awayId!];
        const result = sport.simulateMatch(
          { club: home, lineup: home.tactics.lineup.map((id) => world.players[id]) },
          { club: away, lineup: away.tactics.lineup.map((id) => world.players[id]) },
          rng,
          { allowDraw: false, neutralVenue: true },
        );
        result.fixtureId = fixture.id;
        recordResult(tourney, result);
        expect(result.winnerId).toBeTruthy(); // knockout draws must be resolved
      }
    }

    expect(isComplete(tourney)).toBe(true);
    expect(clubs.map((c) => c.id)).toContain(tourney.championId);
    expect(tourney.bracket!.at(-1)!.matches[0].winnerId).toBe(tourney.championId);
  });
});
