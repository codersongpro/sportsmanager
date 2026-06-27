import type { Club, CompetitionState, GameState, LocalizedText, MatchTeam, Player, SportModule } from "@/lib/types";
import { createRng, hashSeed } from "@/lib/sim/rng";
import { createGroupTournament, createTournament, recordResult } from "./competition";
import { buildNationalTeams } from "./world";

type WorldCupState = NonNullable<GameState["worldCup"]>;
type ClubCupState = NonNullable<GameState["clubCup"]>;

/** Group stage + knockout once there are enough entrants to fill at least two groups; otherwise a plain knockout. */
function createInternationalTournament(
  id: string,
  name: LocalizedText,
  country: string,
  kind: "club" | "national",
  clubs: Club[],
  season: number,
): CompetitionState {
  if (clubs.length >= 8) {
    return createGroupTournament(id, name, country, kind, clubs, season);
  }
  return createTournament(id, name, country, kind, clubs, season);
}

/**
 * Build a World Cup from the existing club-player pool, grouped by
 * nationality (see `buildNationalTeams`). Reuses the same group+knockout
 * engine as club competitions via `kind: "national"`.
 */
export function createWorldCup(
  players: Record<string, Player>,
  sport: SportModule,
  season: number,
  userNationId?: string,
  minSquad = 16,
): WorldCupState {
  const clubs = buildNationalTeams(sport, players, minSquad);
  const competition = createInternationalTournament(
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
 * Simulate one stage of an international tournament: if still in the group
 * stage, every unplayed group fixture resolves at once (this automatically
 * builds the knockout bracket once the last group match is recorded);
 * otherwise the current bracket round resolves at once. This is a side
 * activity outside the day-by-day calendar, so a full stage/round resolves
 * in one step rather than day-by-day.
 */
function simulateTournamentStage(
  comp: CompetitionState,
  clubs: Record<string, Club>,
  players: Record<string, Player>,
  sport: SportModule,
  rng: ReturnType<typeof createRng>,
): string[] {
  const played: string[] = [];
  const pending = comp.groups && !comp.bracket
    ? comp.fixtures.filter((f) => f.groupId && !f.played)
    : (comp.bracket?.[comp.currentRound]?.matches ?? [])
        .filter((m) => m.fixtureId && m.winnerId === null)
        .map((m) => comp.fixtures.find((f) => f.id === m.fixtureId))
        .filter((f): f is NonNullable<typeof f> => !!f && !f.played);

  for (const fixture of pending) {
    const home = clubs[fixture.homeId];
    const away = fixture.awayId ? clubs[fixture.awayId] : undefined;
    if (!home || !away) continue;

    const homeTeam = resolveTeam(home, players, sport);
    const awayTeam = resolveTeam(away, players, sport);
    const result = sport.simulateMatch(homeTeam, awayTeam, rng, { allowDraw: false, neutralVenue: true });
    result.fixtureId = fixture.id;
    recordResult(comp, result);
    played.push(fixture.id);
  }

  return played;
}

/** Returns a new `worldCup` object plus the fixture ids that were just played. */
export function simulateWorldCupRound(
  worldCup: WorldCupState,
  players: Record<string, Player>,
  sport: SportModule,
): { worldCup: WorldCupState; playedFixtureIds: string[] } {
  const next: WorldCupState = structuredClone(worldCup);
  const rng = createRng(next.rngState);
  const played = simulateTournamentStage(next.competition, next.clubs, players, sport, rng);
  next.rngState = rng.state();
  return { worldCup: next, playedFixtureIds: played };
}

/**
 * Picks each sport's top clubs across every country into a continental club
 * cup, guaranteeing the user's own club is included even if it isn't
 * top-reputation.
 */
export function buildClubCupEntrants(
  clubs: Record<string, Club>,
  userClubId: string | undefined,
  count = 16,
): Club[] {
  const sorted = Object.values(clubs).sort((a, b) => b.reputation - a.reputation);
  const entrants = sorted.slice(0, count);
  if (userClubId && !entrants.some((c) => c.id === userClubId)) {
    const userClub = clubs[userClubId];
    if (userClub) entrants[entrants.length - 1] = userClub;
  }
  return entrants;
}

export function createClubCup(
  clubs: Record<string, Club>,
  season: number,
  userClubId?: string,
): ClubCupState {
  const entrants = buildClubCupEntrants(clubs, userClubId);
  const competition = createInternationalTournament(
    `clubcup-${season}`,
    { ko: "클럽컵", en: "Club Cup" },
    "world",
    "club",
    entrants,
    season,
  );
  return { competition, userClubId, rngState: hashSeed(`clubcup-${season}`) };
}

export function simulateClubCupRound(
  clubCup: ClubCupState,
  clubs: Record<string, Club>,
  players: Record<string, Player>,
  sport: SportModule,
): { clubCup: ClubCupState; playedFixtureIds: string[] } {
  const next: ClubCupState = structuredClone(clubCup);
  const rng = createRng(next.rngState);
  const played = simulateTournamentStage(next.competition, clubs, players, sport, rng);
  next.rngState = rng.state();
  return { clubCup: next, playedFixtureIds: played };
}
