import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/sim/rng";
import { getSport } from "@/lib/sports";
import { getClubsForSport, getLeaguesForSport } from "@/data/clubs";
import type { SportId } from "@/lib/types";
import { buildWorld, buildNationalTeams } from "./world";

const sport = getSport("soccer");
const SPORTS: SportId[] = ["soccer", "basketball", "baseball", "volleyball", "pickleball"];

describe("buildWorld", () => {
  const world = buildWorld(sport, createRng(2026), 2026);

  it("builds the soccer club set by default", () => {
    const clubs = getClubsForSport("soccer");
    expect(clubs.length).toBeGreaterThanOrEqual(64);
    expect(Object.keys(world.clubs).length).toBe(clubs.length);
  });

  it("gives every club a squad of at least 30 players", () => {
    for (const club of Object.values(world.clubs)) {
      expect(club.squad.length).toBeGreaterThanOrEqual(30);
      for (const id of club.squad) {
        expect(world.players[id]).toBeDefined();
      }
    }
  });

  it("gives every player both a latin name and a Korean name", () => {
    for (const player of Object.values(world.players)) {
      expect(player.name.length).toBeGreaterThan(0);
      expect(player.nameKo).toBeTruthy();
    }
  });

  it("picks a starting lineup and bench for every club", () => {
    for (const club of Object.values(world.clubs)) {
      expect(club.tactics.lineup.length).toBeGreaterThan(0);
      for (const id of club.tactics.lineup) {
        expect(club.squad).toContain(id);
      }
    }
  });

  it("builds national teams from the shared player pool with enough depth", () => {
    const nationals = buildNationalTeams(sport, world.players);
    expect(Object.keys(nationals).length).toBeGreaterThan(0);
    for (const nation of Object.values(nationals)) {
      expect(nation.squad.length).toBeGreaterThanOrEqual(16);
      for (const id of nation.squad) {
        expect(world.players[id]).toBeDefined();
      }
    }
  });
});

describe("buildWorld multi-sport data", () => {
  for (const id of SPORTS) {
    it(`${id}: uses only leagues and clubs for that sport`, () => {
      const sportModule = getSport(id);
      const world = buildWorld(sportModule, createRng(2026), 2026);
      const expectedClubs = getClubsForSport(id);
      const leagueIds = new Set(getLeaguesForSport(id).map((l) => l.id));

      expect(Object.keys(world.clubs).sort()).toEqual(expectedClubs.map((c) => c.id).sort());
      for (const club of Object.values(world.clubs)) {
        expect(leagueIds.has(club.leagueId)).toBe(true);
      }
    });
  }

  it("non-soccer worlds include sport-inspired player archetype names", () => {
    const world = buildWorld(getSport("basketball"), createRng(77), 2026);
    const names = Object.values(world.players).map((p) => p.name);
    expect(names.some((name) => /Jalen|Cade|Luka|Giannis|Aria/.test(name))).toBe(true);
  });
});
