import { del, get, keys, set } from "idb-keyval";
import type { GameState } from "@/lib/types";

const PREFIX = "sm_save_";

export const CURRENT_VERSION = 2;

/** Bring a save from an older `GameState.version` up to `CURRENT_VERSION`. Pure, so it's testable without IndexedDB. */
export function migrate(state: GameState): GameState {
  if (state.version >= CURRENT_VERSION) return state;
  // v1 -> v2: introduced `GameState.activeMatch` (optional, so no data migration needed beyond the version bump)
  return { ...state, version: CURRENT_VERSION };
}

export interface SaveSummary {
  id: string;
  managerName: string;
  clubName: string;
  sportId: string;
  season: number;
  day: number;
  updatedAt: number;
}

function summarize(state: GameState): SaveSummary {
  const club = state.clubs[state.manager.clubId];
  return {
    id: state.id,
    managerName: state.manager.name,
    clubName: club?.name ?? "?",
    sportId: state.sportId,
    season: state.season,
    day: state.day,
    updatedAt: state.updatedAt,
  };
}

export async function saveGame(state: GameState): Promise<void> {
  await set(`${PREFIX}${state.id}`, state);
}

export async function loadGame(id: string): Promise<GameState | undefined> {
  const state = await get<GameState>(`${PREFIX}${id}`);
  return state ? migrate(state) : undefined;
}

export async function deleteSave(id: string): Promise<void> {
  await del(`${PREFIX}${id}`);
}

export async function listSaves(): Promise<SaveSummary[]> {
  const allKeys = await keys();
  const saveKeys = allKeys.filter((k) => typeof k === "string" && k.startsWith(PREFIX));
  const states = await Promise.all(saveKeys.map((k) => get<GameState>(k as string)));
  return states
    .filter((s): s is GameState => !!s)
    .map(summarize)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
