import { create } from "zustand";
import type { GameState, LocalizedText, Locale, Tactics } from "@/lib/types";
import { getSport } from "@/lib/sports";
import { createNewGame, type NewGameOptions } from "@/lib/engine/newGame";
import { continueGame, rolloverSeason } from "@/lib/engine/season";
import { advanceActiveMatch } from "@/lib/engine/activeMatch";
import { createWorldCup, simulateWorldCupRound } from "@/lib/engine/worldcup";
import { saveGame } from "./persistence";

interface GameStoreState {
  state: GameState | null;
  hydrated: boolean;
  setHydrated: () => void;
  loadFromSave: (save: GameState) => void;
  startNewGame: (opts: NewGameOptions) => void;
  continue: () => void;
  playNextSegment: () => void;
  rolloverSeason: () => void;
  setLocale: (locale: Locale) => void;
  setTrainingFocus: (key: string) => void;
  setTactics: (patch: Partial<Tactics>) => void;
  setLineup: (lineup: string[], bench: string[]) => void;
  autoPickLineup: () => void;
  markNewsRead: (id: string) => void;
  buyPlayer: (playerId: string) => TransferResult;
  sellPlayer: (playerId: string) => void;
  answerPress: (itemId: string, optionIndex: number) => void;
  startWorldCup: (userNationId?: string) => void;
  simulateWorldCupRound: () => void;
}

export interface TransferResult {
  ok: boolean;
  message: LocalizedText;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Negotiated transfer fee: higher manager reputation = a better price. */
export function negotiatedFee(value: number, managerRep: number): number {
  const factor = 1.12 - managerRep / 500; // rep 50 -> 1.02x, rep 90 -> 0.94x
  return Math.max(50000, Math.round((value * factor) / 50000) * 50000);
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
    let next = continueGame(cur, sport);
    // The engine pauses on the user's own fixture (`activeMatch`), so the
    // Match Center can step through it segment by segment. Until that UI
    // exists, auto-play it through here to keep "continue" producing a full
    // result in one click, same as before segmentation was introduced.
    let guard = 0;
    while (next.activeMatch && !next.activeMatch.finished && guard++ < 8) {
      next = advanceActiveMatch(next, sport);
    }
    set({ state: next });
    persist(next);
  },

  playNextSegment: () => {
    const cur = get().state;
    if (!cur || !cur.activeMatch || cur.activeMatch.finished) return;
    const sport = getSport(cur.sportId);
    const next = advanceActiveMatch(cur, sport);
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
    const fail = (ko: string, en: string): TransferResult => ({ ok: false, message: { ko, en } });
    const cur = get().state;
    if (!cur) return fail("", "");
    const player = cur.players[playerId];
    const myClub = cur.clubs[cur.manager.clubId];
    if (!player || !player.clubId || player.clubId === myClub.id) return fail("영입할 수 없는 선수입니다", "Player cannot be signed");
    const seller = cur.clubs[player.clubId];
    if (!seller) return fail("영입할 수 없는 선수입니다", "Player cannot be signed");

    const sport = getSport(cur.sportId);
    const rep = cur.manager.reputation;
    const fee = negotiatedFee(player.value, rep);
    const label = player.nameKo ?? player.name;
    if (myClub.finances.transferBudget < fee) return fail(`이적 예산이 부족합니다`, "Insufficient transfer budget");

    // Sign probability: club appeal + manager reputation vs the player's ambition.
    const appeal = myClub.reputation + rep * 0.5;
    const resistance = sport.calcOverall(player) + seller.reputation * 0.3;
    const prob = clamp(1 / (1 + Math.exp(-(appeal - resistance + 16) / 12)), 0.05, 0.97);

    const next: GameState = structuredClone(cur);
    if (Math.random() > prob) {
      next.news.unshift({ id: `n_t${Date.now()}`, day: next.day, title: { ko: `${label} 영입 협상 결렬`, en: `${player.name} rejected your approach` }, read: false });
      next.updatedAt = Date.now();
      set({ state: next });
      persist(next);
      return fail(`${label} 영입 협상이 결렬되었습니다 (감독 영향력 부족)`, `${player.name} turned down the move`);
    }

    const me = next.clubs[myClub.id];
    const from = next.clubs[player.clubId];
    me.finances.transferBudget -= fee;
    me.finances.balance -= fee;
    from.finances.balance += fee;
    from.squad = from.squad.filter((id) => id !== playerId);
    me.squad.push(playerId);
    next.players[playerId] = { ...player, clubId: me.id };
    next.news.unshift({ id: `n_t${Date.now()}`, day: next.day, title: { ko: `${label} 영입 완료`, en: `Signed ${player.name}` }, read: false });
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
    return { ok: true, message: { ko: `${label} 영입 완료`, en: `Signed ${player.name}` } };
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

  answerPress: (itemId, optionIndex) => {
    const cur = get().state;
    if (!cur) return;
    const next: GameState = structuredClone(cur);
    const item = next.press?.find((p) => p.id === itemId);
    if (!item || item.answered) return;
    const opt = item.options[optionIndex];
    if (!opt) return;
    item.answered = true;
    item.chosen = optionIndex;

    const myClub = next.clubs[next.manager.clubId];
    for (const id of myClub.squad) {
      const p = next.players[id];
      if (p) p.morale = clamp(p.morale + opt.moraleDelta, 0, 100);
    }
    next.manager.reputation = clamp(Math.round((next.manager.reputation + opt.repDelta) * 10) / 10, 1, 99);
    next.news.unshift({ id: `n_p${Date.now()}`, day: next.day, title: opt.reply, read: false });
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  startWorldCup: (userNationId) => {
    const cur = get().state;
    if (!cur) return;
    if (cur.sportId !== "soccer") return;
    const sport = getSport(cur.sportId);
    const worldCup = createWorldCup(cur.players, sport, cur.season, userNationId);
    const next: GameState = { ...cur, worldCup, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },

  simulateWorldCupRound: () => {
    const cur = get().state;
    if (!cur || !cur.worldCup) return;
    if (cur.sportId !== "soccer") return;
    const sport = getSport(cur.sportId);
    const { worldCup } = simulateWorldCupRound(cur.worldCup, cur.players, sport);
    const next: GameState = { ...cur, worldCup, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },
}));
