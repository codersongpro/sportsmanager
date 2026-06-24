import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/sim/rng";
import { buildWorld } from "@/lib/engine/world";
import { CLUBS } from "@/data/clubs";
import { getSport } from "@/lib/sports";
import type { MatchEvent, MatchTeam, Tactics } from "@/lib/types";
import { POSITION_GROUP } from "./constants";
import { simulateMatch } from "./sim";
import { tacticTags } from "./tactics";

const sport = getSport("soccer");

function teamWithTactics(world: ReturnType<typeof buildWorld>, clubId: string, patch: Partial<Tactics>): MatchTeam {
  const club = world.clubs[clubId];
  return {
    club: { ...club, tactics: { ...club.tactics, ...patch } },
    lineup: club.tactics.lineup.map((id) => world.players[id]),
  };
}

function average(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function countFouls(events: MatchEvent[], clubId: string): number {
  return events.filter((e) => e.type === "foul" && e.clubId === clubId).length;
}

const CROSS_FLAVOR_TYPES = new Set(["cross", "overlap", "switchPlay", "corner"]);
function crossEventRatio(events: MatchEvent[], clubId: string): number {
  const own = events.filter((e) => e.clubId === clubId);
  if (!own.length) return 0;
  return own.filter((e) => CROSS_FLAVOR_TYPES.has(e.type)).length / own.length;
}

const SEEDS = Array.from({ length: 40 }, (_, i) => 1000 + i);

describe("tacticTags", () => {
  it("returns exactly 4 bilingual tags describing the tactic combination", () => {
    const base: Tactics = { formation: "4-3-3", mentality: "balanced", tempo: "normal", pressing: "medium", width: "normal", lineup: [], bench: [] };
    for (const mentality of ["attacking", "balanced", "defensive"] as const) {
      for (const tempo of ["fast", "normal", "slow"] as const) {
        const tags = tacticTags({ ...base, mentality, tempo });
        expect(tags.length).toBe(4);
        for (const tag of tags) {
          expect(tag.ko.length).toBeGreaterThan(0);
          expect(tag.en.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("tactic dials affect match simulation (statistical trend across many seeds)", () => {
  it("high pressing draws more fouls on average than low pressing", () => {
    const world = buildWorld(sport, createRng(111), 2026);
    const [a, b] = CLUBS.slice(0, 2);

    const highFouls = SEEDS.map((seed) => {
      const result = simulateMatch(teamWithTactics(world, a.id, { pressing: "high" }), teamWithTactics(world, b.id, {}), createRng(seed), { allowDraw: true });
      return countFouls(result.events, a.id);
    });
    const lowFouls = SEEDS.map((seed) => {
      const result = simulateMatch(teamWithTactics(world, a.id, { pressing: "low" }), teamWithTactics(world, b.id, {}), createRng(seed), { allowDraw: true });
      return countFouls(result.events, a.id);
    });

    expect(average(highFouls)).toBeGreaterThan(average(lowFouls));
  });

  it("fast tempo produces more shots on average than slow tempo", () => {
    const world = buildWorld(sport, createRng(222), 2026);
    const [a, b] = CLUBS.slice(0, 2);

    const fastShots = SEEDS.map((seed) => {
      const result = simulateMatch(teamWithTactics(world, a.id, { tempo: "fast" }), teamWithTactics(world, b.id, {}), createRng(seed), { allowDraw: true });
      return result.stats.homeShots;
    });
    const slowShots = SEEDS.map((seed) => {
      const result = simulateMatch(teamWithTactics(world, a.id, { tempo: "slow" }), teamWithTactics(world, b.id, {}), createRng(seed), { allowDraw: true });
      return result.stats.homeShots;
    });

    expect(average(fastShots)).toBeGreaterThan(average(slowShots));
  });

  it("wide width produces a higher cross-event ratio on average than narrow width", () => {
    const world = buildWorld(sport, createRng(333), 2026);
    const [a, b] = CLUBS.slice(0, 2);

    const wideRatio = SEEDS.map((seed) => {
      const result = simulateMatch(teamWithTactics(world, a.id, { width: "wide" }), teamWithTactics(world, b.id, {}), createRng(seed), { allowDraw: true });
      return crossEventRatio(result.events, a.id);
    });
    const narrowRatio = SEEDS.map((seed) => {
      const result = simulateMatch(teamWithTactics(world, a.id, { width: "narrow" }), teamWithTactics(world, b.id, {}), createRng(seed), { allowDraw: true });
      return crossEventRatio(result.events, a.id);
    });

    expect(average(wideRatio)).toBeGreaterThan(average(narrowRatio));
  });
});

describe("playstyle attribute boosts already flow into match outcomes (verification, no duplicate logic)", () => {
  it("boosting one outfield player's finishing/positioning (a poacher-style boost) increases their average goal share", () => {
    const world = buildWorld(sport, createRng(444), 2026);
    const [a, b] = CLUBS.slice(0, 2);
    const club = world.clubs[a.id];
    let slotIndex = club.tactics.lineup.findIndex((id) => {
      const p = world.players[id];
      return p && POSITION_GROUP[p.positions[0] ?? "CM"] === "FWD";
    });
    if (slotIndex === -1) {
      slotIndex = club.tactics.lineup.findIndex((id) => {
        const p = world.players[id];
        return p && POSITION_GROUP[p.positions[0] ?? "CM"] !== "GK";
      });
    }
    expect(slotIndex).toBeGreaterThanOrEqual(0);
    const targetId = club.tactics.lineup[slotIndex];

    function teamWithBoost(boosted: boolean): MatchTeam {
      const lineup = club.tactics.lineup.map((id) => world.players[id]);
      const target = lineup[slotIndex];
      lineup[slotIndex] = {
        ...target,
        attributes: { ...target.attributes, finishing: boosted ? 95 : 20, positioning: boosted ? 95 : 20 },
      };
      return { club, lineup };
    }

    const opponent = teamWithTactics(world, b.id, {});
    const trialSeeds = Array.from({ length: 300 }, (_, i) => 5000 + i);
    const boostedGoals = trialSeeds.map((seed) => {
      const result = simulateMatch(teamWithBoost(true), opponent, createRng(seed), { allowDraw: true });
      return result.events.filter((e) => e.type === "goal" && e.playerId === targetId).length;
    });
    const baselineGoals = trialSeeds.map((seed) => {
      const result = simulateMatch(teamWithBoost(false), opponent, createRng(seed), { allowDraw: true });
      return result.events.filter((e) => e.type === "goal" && e.playerId === targetId).length;
    });

    expect(average(boostedGoals)).toBeGreaterThan(average(baselineGoals));
  });
});
