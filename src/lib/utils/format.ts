import type { Club, Player } from "@/lib/types";

/** Always shows both the Latin and Korean form together (never locale-gated). */
export function playerDisplayName(player: Player): string {
  return player.nameKo ? `${player.name} (${player.nameKo})` : player.name;
}

export function clubDisplayName(club: Club): string {
  return club.nameKo ? `${club.name} / ${club.nameKo}` : club.name;
}

export function formatMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
}
