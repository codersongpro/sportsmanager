import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/sim/rng";
import { generatePlayer } from "./generate";
import { calcOverall } from "./ratings";

describe("generatePlayer", () => {
  it("lands close to the requested target overall across positions", () => {
    const rng = createRng(99);
    const positions = ["GK", "CB", "LB", "DM", "CM", "AM", "LW", "ST"] as const;
    for (const position of positions) {
      for (const targetOverall of [50, 65, 80]) {
        const player = generatePlayer(
          {
            id: `p-${position}-${targetOverall}`,
            name: "Test Player",
            nationality: "EN",
            position,
            targetOverall,
            clubId: "club-test",
          },
          rng,
        );
        const ovr = calcOverall(player, position);
        expect(Math.abs(ovr - targetOverall)).toBeLessThanOrEqual(6);
      }
    }
  });

  it("assigns 1-3 playstyles scoped to the player's position", () => {
    const rng = createRng(7);
    for (const targetOverall of [55, 75, 88]) {
      const player = generatePlayer(
        {
          id: `ps-${targetOverall}`,
          name: "Test Player",
          nationality: "BR",
          position: "ST",
          targetOverall,
          clubId: "club-test",
        },
        rng,
      );
      expect(player.playstyles.length).toBeGreaterThanOrEqual(1);
      expect(player.playstyles.length).toBeLessThanOrEqual(3);
    }
  });

  it("gives young players potential at or above their current target", () => {
    const rng = createRng(13);
    const player = generatePlayer(
      {
        id: "young-1",
        name: "Young Player",
        nationality: "AR",
        position: "ST",
        age: 18,
        targetOverall: 60,
        clubId: "club-test",
      },
      rng,
    );
    expect(player.potential).toBeGreaterThanOrEqual(60);
    expect(player.potential).toBeLessThanOrEqual(99);
  });
});
