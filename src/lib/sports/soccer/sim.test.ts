import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/sim/rng";
import { buildWorld } from "@/lib/engine/world";
import { CLUBS } from "@/data/clubs";
import { getSport } from "@/lib/sports";
import { simulateMatch } from "./sim";

const sport = getSport("soccer");

function teamFor(world: ReturnType<typeof buildWorld>, clubId: string) {
  const club = world.clubs[clubId];
  return { club, lineup: club.tactics.lineup.map((id) => world.players[id]) };
}

describe("simulateMatch", () => {
  it("is deterministic for the same seed and teams", () => {
    const world = buildWorld(sport, createRng(456), 2026);
    const [a, b] = CLUBS.slice(0, 2);

    const r1 = simulateMatch(teamFor(world, a.id), teamFor(world, b.id), createRng(1), { allowDraw: true });
    const r2 = simulateMatch(teamFor(world, a.id), teamFor(world, b.id), createRng(1), { allowDraw: true });

    expect(r1.homeScore).toBe(r2.homeScore);
    expect(r1.awayScore).toBe(r2.awayScore);
    expect(r1.events).toEqual(r2.events);
  });

  it("always produces a winner in knockout mode, even when scores end level", () => {
    const world = buildWorld(sport, createRng(789), 2026);
    const [a, b] = CLUBS.slice(0, 2);
    const rng = createRng(2);

    for (let i = 0; i < 30; i++) {
      const result = simulateMatch(teamFor(world, a.id), teamFor(world, b.id), rng, {
        allowDraw: false,
        neutralVenue: true,
      });
      expect(result.winnerId).toBeTruthy();
      expect([a.id, b.id]).toContain(result.winnerId);
      if (result.homeScore === result.awayScore) {
        expect(["extra_time", "penalties"]).toContain(result.decidedBy);
      }
    }
  });
});
