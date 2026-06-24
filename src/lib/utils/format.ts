import type { Club, LocalizedText, Player } from "@/lib/types";

export function localizedDisplayName(name: LocalizedText): string {
  return name.ko && name.ko !== name.en ? `${name.ko} (${name.en})` : name.en;
}

/** Always shows both forms together, Korean first then Latin (never locale-gated). */
export function playerDisplayName(player: Player): string {
  return player.nameKo && player.nameKo !== player.name ? `${player.nameKo} (${player.name})` : player.name;
}

export function clubDisplayName(club: Club): string {
  return club.nameKo && club.nameKo !== club.name ? `${club.nameKo} (${club.name})` : club.name;
}

export function formatMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
}
