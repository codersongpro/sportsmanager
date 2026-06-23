import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/sim/rng";
import { getSport } from "@/lib/sports";
import { CLUBS } from "@/data/clubs";
import { buildWorld, buildNationalTeams } from "./world";

const sport = getSport("soccer");

describe("buildWorld", () => {
  const world = buildWorld(sport, createRng(2026), 2026);

  it("builds at least 64 clubs", () => {
    expect(CLUBS.length).toBeGreaterThanOrEqual(64);
    expect(Object.keys(world.clubs).length).toBe(CLUBS.length);
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
