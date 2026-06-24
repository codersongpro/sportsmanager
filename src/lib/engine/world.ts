import type { Club, Finances, Player, SportId, SportModule, Tactics } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { COUNTRIES, COUNTRY_BY_CODE } from "@/data/countries";
import { getClubsForSport, getNameArchetypesForSport, type ClubSeed } from "@/data/clubs";

export interface World {
  clubs: Record<string, Club>;
  players: Record<string, Player>;
}

const STRENGTH_WEIGHTS = COUNTRIES.map((c) => c.strength);

function pickNationality(seed: ClubSeed, rng: RNG): string {
  // ~55% home nation, else a foreign nation weighted by football strength
  if (rng.bool(0.55)) return seed.country;
  return rng.weighted(
    COUNTRIES.map((c) => c.code),
    STRENGTH_WEIGHTS,
  );
}

function makeName(sportId: SportId, code: string, rng: RNG, preferArchetype = false): { name: string; nameKo: string } {
  const archetypes = getNameArchetypesForSport(sportId);
  if (archetypes.length > 0 && (preferArchetype || rng.bool(0.18))) {
    return archetypes[rng.int(0, archetypes.length - 1)];
  }

  const country = COUNTRY_BY_CODE[code] ?? COUNTRIES[0];
  const fi = rng.int(0, country.firstNames.length - 1);
  const li = rng.int(0, country.lastNames.length - 1);
  const first = country.firstNames[fi];
  const last = country.lastNames[li];
  const firstKo = country.firstNamesKo[fi];
  const lastKo = country.lastNamesKo[li];
  const name = `${first} ${last}`;
  // Korean names render family-name-first with no space, matching local convention.
  const nameKo = code === "KR" ? `${lastKo}${firstKo}` : `${firstKo} ${lastKo}`;
  return { name, nameKo };
}

function clubFinances(reputation: number, weeklyWageTotal: number): Finances {
  const transferBudget = Math.max(
    1_000_000,
    Math.round((reputation - 60) ** 2 * 220_000),
  );
  return {
    balance: Math.round(transferBudget * 1.4),
    transferBudget,
    wageBudget: Math.round(weeklyWageTotal * 1.25),
  };
}

/** Build the full club world: every club populated with ~30 players. */
export function buildWorld(sport: SportModule, rng: RNG, startSeason: number): World {
  const clubs: Record<string, Club> = {};
  const players: Record<string, Player> = {};

  for (const seed of getClubsForSport(sport.id)) {
    const squad: string[] = [];
    let number = 1;
    let depthIndex = 0;

    for (const slot of sport.squadTemplate) {
      for (let i = 0; i < slot.count; i++) {
        // first-choice players near club reputation, depth weaker
        const depthPenalty = i === 0 ? rng.range(-1, 4) : -rng.range(3, 11);
        const target = Math.max(40, Math.min(94, seed.reputation + depthPenalty + rng.gaussian(0, 3)));
        const nat = pickNationality(seed, rng);
        const nm = makeName(sport.id, nat, rng, sport.id !== "soccer" && i === 0);
        const id = `p_${seed.id}_${depthIndex++}`;
        const player = sport.generatePlayer(
          {
            id,
            name: nm.name,
            nameKo: nm.nameKo,
            nationality: nat,
            position: slot.pos,
            targetOverall: Math.round(target),
            clubId: seed.id,
          },
          rng,
        );
        player.contractUntil = startSeason + rng.int(1, 4);
        player.squadNumber = number++;
        players[id] = player;
        squad.push(id);
      }
    }

    const weeklyWageTotal = squad.reduce((s, id) => s + players[id].wage, 0);
    const tactics: Tactics = sport.defaultTactics();
    const club: Club = {
      id: seed.id,
      name: seed.name.en,
      nameKo: seed.name.ko,
      shortName: seed.short,
      leagueId: seed.leagueId,
      country: seed.country,
      reputation: seed.reputation,
      finances: clubFinances(seed.reputation, weeklyWageTotal),
      squad,
      tactics,
      primaryColor: seed.color,
    };
    const picked = sport.autoPickLineup(club, players);
    club.tactics = { ...tactics, lineup: picked.lineup, bench: picked.bench };
    clubs[seed.id] = club;
  }

  return { clubs, players };
}

/**
 * Build national teams from the club player pool, grouped by nationality.
 * Only nations with enough players get a team. Returns national clubs keyed by
 * `nat-<code>`; player ids are shared with their domestic clubs.
 */
export function buildNationalTeams(
  sport: SportModule,
  players: Record<string, Player>,
  minSquad = 16,
): Record<string, Club> {
  const byNation: Record<string, Player[]> = {};
  for (const p of Object.values(players)) {
    (byNation[p.nationality] ??= []).push(p);
  }

  const nationals: Record<string, Club> = {};
  for (const country of COUNTRIES) {
    const pool = (byNation[country.code] ?? []).slice();
    if (pool.length < minSquad) continue;
    pool.sort((a, b) => sport.calcOverall(b) - sport.calcOverall(a));
    const squadPlayers = pool.slice(0, 26);
    const top = squadPlayers.slice(0, 16);
    const reputation = Math.round(top.reduce((s, p) => s + sport.calcOverall(p), 0) / top.length);

    const id = `nat-${country.code}`;
    const club: Club = {
      id,
      name: country.name.en,
      nameKo: country.name.ko,
      shortName: country.code,
      leagueId: "world",
      country: country.code,
      reputation,
      finances: { balance: 0, transferBudget: 0, wageBudget: 0 },
      squad: squadPlayers.map((p) => p.id),
      tactics: sport.defaultTactics(),
      primaryColor: "#2b6cb0",
      isNational: true,
    };
    const picked = sport.autoPickLineup(club, players);
    club.tactics = { ...club.tactics, lineup: picked.lineup, bench: picked.bench };
    nationals[id] = club;
  }
  return nationals;
}
