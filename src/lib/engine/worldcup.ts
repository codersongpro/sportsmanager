import type { Club, GameState, MatchTeam, Player, SportModule } from "@/lib/types";
import { createRng, hashSeed } from "@/lib/sim/rng";
import { createTournament, recordResult } from "./competition";
import { buildNationalTeams } from "./world";

type WorldCupState = NonNullable<GameState["worldCup"]>;

/**
 * Build a World Cup knockout bracket from the existing club-player pool,
 * grouped by nationality (see `buildNationalTeams`). This reuses the same
 * tournament engine as club championships via `kind: "national"`.
 */
export function createWorldCup(
  players: Record<string, Player>,
  sport: SportModule,
  season: number,
  userNationId?: string,
  minSquad = 16,
): WorldCupState {
  const clubs = buildNationalTeams(sport, players, minSquad);
  const competition = createTournament(
    `worldcup-${season}`,
    { ko: "월드컵", en: "World Cup" },
    "world",
    "national",
    Object.values(clubs),
    season,
  );
  return { competition, clubs, userNationId, rngState: hashSeed(`worldcup-${season}`) };
}

function resolveTeam(club: Club, players: Record<string, Player>, sport: SportModule): MatchTeam {
  let ids = club.tactics.lineup.filter((id) => players[id]);
  if (ids.length < 11) ids = sport.autoPickLineup(club, players).lineup;
  return { club, lineup: ids.map((id) => players[id]) };
}

/**
 * Simulate every unplayed fixture in the current bracket round at once
 * (the World Cup is a side activity outside the day-by-day calendar, so a
 * full round resolves in one step rather than day-by-day). Returns a new
 * `worldCup` object plus the fixture ids that were just played.
 */
export function simulateWorldCupRound(
  worldCup: WorldCupState,
  players: Record<string, Player>,
  sport: SportModule,
): { worldCup: WorldCupState; playedFixtureIds: string[] } {
  const next: WorldCupState = structuredClone(worldCup);
  const rng = createRng(next.rngState);
  const comp = next.competition;
  const round = comp.bracket?.[comp.currentRound];
  const played: string[] = [];

  if (round) {
    for (const match of round.matches) {
      if (!match.fixtureId || match.winnerId !== null) continue;
      const fixture = comp.fixtures.find((f) => f.id === match.fixtureId);
      if (!fixture || fixture.played) continue;
      const home = next.clubs[fixture.homeId];
      const away = fixture.awayId ? next.clubs[fixture.awayId] : undefined;
      if (!home || !away) continue;

      const homeTeam = resolveTeam(home, players, sport);
      const awayTeam = resolveTeam(away, players, sport);
      const result = sport.simulateMatch(homeTeam, awayTeam, rng, { allowDraw: false, neutralVenue: true });
      result.fixtureId = fixture.id;
      recordResult(comp, result);
      played.push(fixture.id);
    }
  }

  next.rngState = rng.state();
  return { worldCup: next, playedFixtureIds: played };
}
