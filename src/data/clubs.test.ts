import { describe, expect, it } from "vitest";
import type { SportId } from "@/lib/types";
import {
  CLUBS,
  getClubByIdForSport,
  getClubsForSport,
  getLeaguesForSport,
  getNameArchetypesForSport,
} from "./clubs";

const SPORTS: SportId[] = ["soccer", "basketball", "baseball", "volleyball", "pickleball"];

describe("sport-specific club data", () => {
  for (const sportId of SPORTS) {
    it(`${sportId}: exposes leagues and clubs for new games`, () => {
      const leagues = getLeaguesForSport(sportId);
      const clubs = getClubsForSport(sportId);
      expect(leagues.length).toBeGreaterThanOrEqual(2);
      expect(clubs.length).toBeGreaterThanOrEqual(8);

      const leagueIds = new Set(leagues.map((l) => l.id));
      for (const league of leagues) {
        expect(/[가-힣]/.test(league.name.ko)).toBe(true);
      }
      for (const club of clubs) {
        expect(leagueIds.has(club.leagueId)).toBe(true);
        expect(getClubByIdForSport(sportId, club.id)).toEqual(club);
        expect(/[가-힣]/.test(club.name.ko)).toBe(true);
      }
    });
  }

  it("keeps the legacy CLUBS export as the soccer club set", () => {
    expect(CLUBS).toEqual(getClubsForSport("soccer"));
  });

  it("does not reuse soccer club ids for other sports", () => {
    const soccerIds = new Set(getClubsForSport("soccer").map((c) => c.id));
    for (const sportId of SPORTS.filter((id) => id !== "soccer")) {
      expect(getClubsForSport(sportId).some((club) => soccerIds.has(club.id))).toBe(false);
    }
  });

  it("non-soccer archetype player names include Korean display names", () => {
    for (const sportId of SPORTS.filter((id) => id !== "soccer")) {
      for (const name of getNameArchetypesForSport(sportId)) {
        expect(/[가-힣]/.test(name.nameKo)).toBe(true);
        expect(name.nameKo).not.toBe(name.name);
      }
    }
  });
});
