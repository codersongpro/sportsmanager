import { create } from "zustand";
import type { GameState, Locale, Tactics } from "@/lib/types";
import { getSport } from "@/lib/sports";
import { createNewGame, type NewGameOptions } from "@/lib/engine/newGame";
import { continueGame, rolloverSeason } from "@/lib/engine/season";
import { createWorldCup, simulateWorldCupRound } from "@/lib/engine/worldcup";
import { saveGame } from "./persistence";

interface GameStoreState {
  state: GameState | null;
  hydrated: boolean;
  setHydrated: () => void;
  loadFromSave: (save: GameState) => void;
  startNewGame: (opts: NewGameOptions) => void;
  continue: () => void;
  rolloverSeason: () => void;
  setLocale: (locale: Locale) => void;
  setTrainingFocus: (key: string) => void;
  setTactics: (patch: Partial<Tactics>) => void;
  setLineup: (lineup: string[], bench: string[]) => void;
  autoPickLineup: () => void;
  markNewsRead: (id: string) => void;
  buyPlayer: (playerId: string) => void;
  sellPlayer: (playerId: string) => void;
  startWorldCup: (userNationId?: string) => void;
  simulateWorldCupRound: () => void;
}

function persist(state: GameState) {
  saveGame(state).catch(() => {
    /* best-effort autosave; ignore quota/availability errors */
  });
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  state: null,
  hydrated: false,
  setHydrated: () => set({ hydrated: true }),

  loadFromSave: (save) => set({ state: save }),

  startNewGame: (opts) => {
    const next = createNewGame(opts);
    set({ state: next });
    persist(next);
  },

  continue: () => {
    const cur = get().state;
    if (!cur) return;
    const sport = getSport(cur.sportId);
    const next = continueGame(cur, sport);
    set({ state: next });
    persist(next);
  },

  rolloverSeason: () => {
    const cur = get().state;
    if (!cur) return;
    const sport = getSport(cur.sportId);
    const next = rolloverSeason(cur, sport);
    set({ state: next });
    persist(next);
  },

  setLocale: (locale) => {
    const cur = get().state;
    if (!cur) return;
    const next: GameState = { ...cur, locale, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },

  setTrainingFocus: (key) => {
    const cur = get().state;
    if (!cur) return;
    const next: GameState = { ...cur, trainingFocus: key, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },

  setTactics: (patch) => {
    const cur = get().state;
    if (!cur) return;
    const club = cur.clubs[cur.manager.clubId];
    if (!club) return;
    const next: GameState = structuredClone(cur);
    next.clubs[cur.manager.clubId].tactics = { ...club.tactics, ...patch };
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  setLineup: (lineup, bench) => {
    const cur = get().state;
    if (!cur) return;
    const next: GameState = structuredClone(cur);
    next.clubs[cur.manager.clubId].tactics.lineup = lineup;
    next.clubs[cur.manager.clubId].tactics.bench = bench;
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  autoPickLineup: () => {
    const cur = get().state;
    if (!cur) return;
    const sport = getSport(cur.sportId);
    const next: GameState = structuredClone(cur);
    const club = next.clubs[cur.manager.clubId];
    const picked = sport.autoPickLineup(club, next.players);
    club.tactics.lineup = picked.lineup;
    club.tactics.bench = picked.bench;
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  markNewsRead: (id) => {
    const cur = get().state;
    if (!cur) return;
    const next: GameState = structuredClone(cur);
    const item = next.news.find((n) => n.id === id);
    if (item) item.read = true;
    set({ state: next });
    persist(next);
  },

  buyPlayer: (playerId) => {
    const cur = get().state;
    if (!cur) return;
    const player = cur.players[playerId];
    const myClub = cur.clubs[cur.manager.clubId];
    if (!player || !player.clubId || player.clubId === myClub.id) return;
    const seller = cur.clubs[player.clubId];
    if (!seller || myClub.finances.transferBudget < player.value) return;

    const next: GameState = structuredClone(cur);
    const me = next.clubs[myClub.id];
    const from = next.clubs[player.clubId];
    me.finances.transferBudget -= player.value;
    me.finances.balance -= player.value;
    from.finances.balance += player.value;
    from.squad = from.squad.filter((id) => id !== playerId);
    me.squad.push(playerId);
    next.players[playerId] = { ...player, clubId: me.id };
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  sellPlayer: (playerId) => {
    const cur = get().state;
    if (!cur) return;
    const player = cur.players[playerId];
    const myClub = cur.clubs[cur.manager.clubId];
    if (!player || player.clubId !== myClub.id) return;

    const next: GameState = structuredClone(cur);
    const me = next.clubs[myClub.id];
    const fee = Math.round(player.value * 0.9);
    me.finances.balance += fee;
    me.finances.transferBudget += fee;
    me.squad = me.squad.filter((id) => id !== playerId);
    next.players[playerId] = { ...player, clubId: null };
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  startWorldCup: (userNationId) => {
    const cur = get().state;
    if (!cur) return;
    const sport = getSport(cur.sportId);
    const worldCup = createWorldCup(cur.players, sport, cur.season, userNationId);
    const next: GameState = { ...cur, worldCup, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },

  simulateWorldCupRound: () => {
    const cur = get().state;
    if (!cur || !cur.worldCup) return;
    const sport = getSport(cur.sportId);
    const { worldCup } = simulateWorldCupRound(cur.worldCup, cur.players, sport);
    const next: GameState = { ...cur, worldCup, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },
}));
