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

/** Short on-pitch label (surname / Korean given name) for crowded live-viz markers. */
export function playerShortName(p: Player): string {
  if (p.nameKo) return p.nameKo;
  const parts = p.name.split(" ");
  return parts[parts.length - 1];
}

/** Korean first syllable, or initials of latin name parts (max 2 chars). */
export function playerInitials(player: Player): string {
  const name = player.nameKo || player.name;
  if (/[가-힣]/.test(name[0])) return name[0];
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
}
