import { describe, expect, it } from "vitest";
import { getSport } from "@/lib/sports";
import { getClubsForSport } from "@/data/clubs";
import { createNewGame } from "@/lib/engine/newGame";
import { CURRENT_VERSION, migrate } from "./persistence";

describe("migrate (save version upgrades, pure / no IndexedDB)", () => {
  function freshSave() {
    const sport = getSport("soccer");
    const club = getClubsForSport("soccer")[0];
    return createNewGame({
      sportId: sport.id,
      format: "league",
      leagueId: club.leagueId,
      clubId: club.id,
      managerName: "Test Manager",
      locale: "ko",
    });
  }

  it("leaves an up-to-date save untouched", () => {
    const save = freshSave();
    expect(save.version).toBe(CURRENT_VERSION);
    expect(migrate(save)).toBe(save);
  });

  it("upgrades a v1 save (pre-activeMatch) to the current version", () => {
    const save = { ...freshSave(), version: 1 } as ReturnType<typeof freshSave>;
    delete (save as { activeMatch?: unknown }).activeMatch;

    const migrated = migrate(save);
    expect(migrated.version).toBe(CURRENT_VERSION);
    expect(migrated.activeMatch).toBeUndefined();
    // everything else is preserved
    expect(migrated.id).toBe(save.id);
    expect(migrated.players).toBe(save.players);
  });
});
