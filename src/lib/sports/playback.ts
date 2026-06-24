import type { MatchEvent, MatchPresentation } from "@/lib/types";

export function progressPerSecond(presentation: MatchPresentation, speed: number): number {
  return (presentation.endProgress / presentation.regulationMinutes) * speed;
}

/** Higher playback speed thins out lower-priority flavor events so a feed stays readable. */
export function feedToneRankFloor(speed: number): number {
  if (speed <= 2) return 0;
  if (speed <= 4) return 1;
  if (speed <= 8) return 2;
  return 3;
}

/** Importance rank used to decide which events survive feed filtering at high speed. */
export function toneRank(tone?: string): number {
  switch (tone) {
    case "score":
    case "danger": return 3;
    case "warn": return 2;
    case "info": return 1;
    default: return 0;
  }
}

/** Momentum weight per event tone — a separate scale from the feed-filter toneRank above. */
export function eventWeight(tone?: string): number {
  switch (tone) {
    case "score": return 3;
    case "danger": return 2;
    case "warn": return 1;
    case "info": return 1;
    default: return 0;
  }
}

/**
 * Buckets `events` into `bucketCount` slices of the match timeline and scores each
 * slice's home/away share of weighted events, for the momentum bar widget. Slices
 * beyond `clock` (not yet revealed) come back as `homePct: null`.
 */
export function momentumBuckets(
  events: MatchEvent[],
  clock: number,
  totalSpan: number,
  homeId: string,
  awayId: string,
  pres: MatchPresentation,
  bucketCount = 12,
): { homePct: number | null }[] {
  const width = totalSpan / bucketCount;
  return Array.from({ length: bucketCount }, (_, i) => {
    const from = i * width;
    const to = from + width;
    if (from >= clock) return { homePct: null };
    let homeW = 0;
    let awayW = 0;
    for (const ev of events) {
      if (ev.minute < from || ev.minute >= to) continue;
      const w = eventWeight(pres.eventMeta(ev.type).tone);
      if (w === 0) continue;
      if (ev.clubId === homeId) homeW += w;
      else if (ev.clubId === awayId) awayW += w;
    }
    const total = homeW + awayW;
    return { homePct: total === 0 ? 50 : Math.round((homeW / total) * 100) };
  });
}
