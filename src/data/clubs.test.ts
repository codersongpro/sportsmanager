import { describe, expect, it } from "vitest";
import type { SportId } from "@/lib/types";
import {
  CLUBS,
  getClubByIdForSport,
  getClubsForSport,
  getLeaguesForSport,
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
      for (const club of clubs) {
        expect(leagueIds.has(club.leagueId)).toBe(true);
        expect(getClubByIdForSport(sportId, club.id)).toEqual(club);
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
});
