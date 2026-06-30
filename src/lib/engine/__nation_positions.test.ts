import { describe, it, expect } from "vitest";
import { createRng } from "@/lib/sim/rng";
import { buildWorld, buildNationalTeams } from "./world";
import { getSport } from "@/lib/sports";
import { COUNTRIES } from "@/data/countries";
import type { SportId } from "@/lib/types";

const SPORTS: SportId[] = ["soccer", "basketball", "baseball", "volleyball", "pickleball"];

describe("national squads are position-complete", () => {
  for (const sportId of SPORTS) {
    it(`${sportId}: every national team (incl. a thin guaranteed nation) fields a valid lineup`, () => {
      const sport = getSport(sportId);
      const world = buildWorld(sport, createRng(2026), 2026);

      // Every naturally-qualifying nation must field a valid lineup.
      const nats = buildNationalTeams(sport, world.players, 16);
      let count = 0;
      for (const club of Object.values(nats)) {
        const v = sport.validateLineup(club, world.players);
        expect(v.valid, `${sportId} ${club.id}: ${v.errors.map((e) => e.en).join(", ")}`).toBe(true);
        count++;
      }
      expect(count).toBeGreaterThan(0);

      // The thinnest-pool nation, when guaranteed, is still backfilled to validity.
      const counts: Record<string, number> = {};
      for (const p of Object.values(world.players)) counts[p.nationality] = (counts[p.nationality] ?? 0) + 1;
      const thin = (COUNTRIES.filter((c) => counts[c.code]).sort((a, b) => (counts[a.code] ?? 0) - (counts[b.code] ?? 0))[0] ?? COUNTRIES[0]).code;
      const guaranteed = buildNationalTeams(sport, world.players, 16, thin)[`nat-${thin}`];
      expect(guaranteed, `guaranteed nation nat-${thin} should exist`).toBeTruthy();
      const gv = sport.validateLineup(guaranteed, world.players);
      expect(gv.valid, `${sportId} thin nat-${thin}: ${gv.errors.map((e) => e.en).join(", ")}`).toBe(true);
      expect(guaranteed.squad.length).toBeGreaterThanOrEqual(sport.formations[0].slots.length);
    });
  }
});
