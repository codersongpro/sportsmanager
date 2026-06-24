import { describe, it, expect } from "vitest";
import { createRng } from "@/lib/sim/rng";
import { buildWorld } from "@/lib/engine/world";
import { getClubsForSport } from "@/data/clubs";
import { getSport } from "@/lib/sports";
import type { SportId } from "@/lib/types";

const SPORTS: SportId[] = ["basketball", "baseball", "volleyball", "pickleball"];
const VENUES: Record<(typeof SPORTS)[number], string> = {
  basketball: "hardwood",
  baseball: "diamond",
  volleyball: "volleyballCourt",
  pickleball: "pickleballCourt",
};

describe("multi-sport modules", () => {
  for (const id of SPORTS) {
    const sport = getSport(id);

    it(`${id}: builds a world with non-empty squads and valid overalls`, () => {
      const world = buildWorld(sport, createRng(123), 2026);
      const club = world.clubs[getClubsForSport(id)[0].id];
      expect(club.squad.length).toBeGreaterThanOrEqual(8);
      expect(club.tactics.lineup.length).toBe(sport.formations[0].slots.length);
      for (const pid of club.squad) {
        const p = world.players[pid];
        expect(p.name.length).toBeGreaterThan(0);
        expect(p.nameKo && p.nameKo.length).toBeTruthy();
        const ovr = sport.calcOverall(p);
        expect(ovr).toBeGreaterThan(20);
        expect(ovr).toBeLessThanOrEqual(99);
      }
    });

    it(`${id}: simulateMatch is deterministic and always has a winner`, () => {
      const world = buildWorld(sport, createRng(7), 2026);
      const [a, b] = getClubsForSport(id).slice(0, 2);
      const team = (cid: string) => ({ club: world.clubs[cid], lineup: world.clubs[cid].tactics.lineup.map((p) => world.players[p]) });

      const r1 = sport.simulateMatch(team(a.id), team(b.id), createRng(3), { allowDraw: true });
      const r2 = sport.simulateMatch(team(a.id), team(b.id), createRng(3), { allowDraw: true });
      expect(r1.homeScore).toBe(r2.homeScore);
      expect(r1.events).toEqual(r2.events);
      expect(r1.winnerId).toBeTruthy();
      expect([a.id, b.id]).toContain(r1.winnerId);
      // a winner means scores are never level at the end
      expect(r1.homeScore === r1.awayScore).toBe(false);
    });

    it(`${id}: scoreOf(events) reconstructs the final score`, () => {
      const world = buildWorld(sport, createRng(50), 2026);
      const [a, b] = getClubsForSport(id).slice(0, 2);
      const team = (cid: string) => ({ club: world.clubs[cid], lineup: world.clubs[cid].tactics.lineup.map((p) => world.players[p]) });
      const r = sport.simulateMatch(team(a.id), team(b.id), createRng(9), { allowDraw: true });
      const pres = sport.matchPresentation;
      expect(pres.scoreOf(r.events, a.id)).toBe(r.homeScore);
      expect(pres.scoreOf(r.events, b.id)).toBe(r.awayScore);
    });

    it(`${id}: match feed exposes a broad Korean event vocabulary`, () => {
      const world = buildWorld(sport, createRng(51), 2026);
      const [a, b] = getClubsForSport(id).slice(0, 2);
      const team = (cid: string) => ({ club: world.clubs[cid], lineup: world.clubs[cid].tactics.lineup.map((p) => world.players[p]) });
      const r = sport.simulateMatch(team(a.id), team(b.id), createRng(19), { allowDraw: true });
      const types = new Set(r.events.map((e) => e.type));

      expect(types.size).toBeGreaterThanOrEqual(12);
      for (const type of types) {
        expect(/[가-힣]/.test(sport.matchPresentation.eventMeta(type).label.ko)).toBe(true);
      }
    });

    it(`${id}: presentation declares real match minutes and a sport-specific venue`, () => {
      expect(sport.matchPresentation.regulationMinutes).toBeGreaterThan(0);
      expect(sport.matchPresentation.venue).toBe(VENUES[id]);
    });
  }
});

describe("soccer presentation", () => {
  it("declares real match minutes and the football pitch venue", () => {
    const sport = getSport("soccer");
    expect(sport.matchPresentation.regulationMinutes).toBe(90);
    expect(sport.matchPresentation.venue).toBe("pitch");
  });

  it("emits Korean-labelled football broadcast events beyond scoring", () => {
    const sport = getSport("soccer");
    const world = buildWorld(sport, createRng(52), 2026);
    const [a, b] = getClubsForSport("soccer").slice(0, 2);
    const team = (cid: string) => ({ club: world.clubs[cid], lineup: world.clubs[cid].tactics.lineup.map((p) => world.players[p]) });
    const r = sport.simulateMatch(team(a.id), team(b.id), createRng(20), { allowDraw: true });
    const types = new Set(r.events.map((e) => e.type));

    expect(types.size).toBeGreaterThanOrEqual(12);
    for (const type of types) {
      expect(/[가-힣]/.test(sport.matchPresentation.eventMeta(type).label.ko)).toBe(true);
    }
  });
});
