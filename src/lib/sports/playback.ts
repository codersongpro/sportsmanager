import type { Club, MatchEvent, MatchPresentation, Player, SportModule } from "@/lib/types";
import { playerShortName } from "@/lib/utils/format";

export interface SlotPlayer {
  pos: string;
  x: number;
  y: number;
  player?: Player;
}

/** Resolves a club's current starting XI into formation slots, auto-filling from the squad if the saved lineup is short. */
export function lineupSlots(sport: SportModule, club: Club, players: Record<string, Player>): SlotPlayer[] {
  const formation = sport.formations.find((f) => f.key === club.tactics.formation) ?? sport.formations[0];
  if (!formation) return [];
  let ids = club.tactics.lineup.filter((id) => players[id]);
  if (ids.length < formation.slots.length) ids = sport.autoPickLineup(club, players).lineup;
  return formation.slots.map((s, i) => ({ pos: s.position, x: s.x, y: s.y, player: players[ids[i]] }));
}

export interface LiveMarker {
  id: string;
  x: number;
  y: number;
  label: string;
  highlight?: boolean;
}

export interface LiveVenueState {
  homeMarkers: LiveMarker[];
  awayMarkers: LiveMarker[];
  ballX: number;
  ballY: number;
}

/**
 * Computes player markers + ball position for the live venue, shared between the
 * post-match replay viewer and the in-progress Match Center page. Baseball alternates
 * which side is on the field vs at the plate; every other sport keeps both full sides
 * on the surface throughout. The ball snaps to whichever player most recently took
 * part in a revealed event, falling back to a zone-based estimate for team-level events
 * with no resolvable player.
 */
export function buildLiveVenue(
  pres: MatchPresentation,
  revealed: MatchEvent[],
  homeSlots: SlotPlayer[],
  awaySlots: SlotPlayer[],
  players: Record<string, Player>,
  homeId: string,
  awayId: string,
  clock: number,
): LiveVenueState {
  const last = revealed[revealed.length - 1];
  const lastEventPlayerId = last?.playerId;

  const isDiamond = pres.venue === "diamond";
  const fieldingIsHome = isDiamond ? clock - Math.floor(clock) < 0.5 : null;
  const battingClubId = isDiamond ? (fieldingIsHome ? awayId : homeId) : null;
  const lastBatter = isDiamond ? [...revealed].reverse().find((e) => e.playerId && e.clubId === battingClubId) : undefined;
  const batterPlayer = lastBatter?.playerId ? players[lastBatter.playerId] : undefined;
  const batterMarker: LiveMarker[] = batterPlayer
    ? [{ id: batterPlayer.id, x: 62, y: 8, label: playerShortName(batterPlayer), highlight: batterPlayer.id === lastEventPlayerId }]
    : [];

  const sideMarkers = (slots: SlotPlayer[], isHome: boolean): LiveMarker[] =>
    slots
      .filter((s): s is SlotPlayer & { player: Player } => !!s.player)
      .map((s) => ({
        id: s.player.id,
        ...slotToVenuePos(pres.venue, s, isHome),
        label: playerShortName(s.player),
        highlight: s.player.id === lastEventPlayerId,
      }));

  const homeMarkers = isDiamond ? (fieldingIsHome ? sideMarkers(homeSlots, true) : batterMarker) : sideMarkers(homeSlots, true);
  const awayMarkers = isDiamond ? (fieldingIsHome ? batterMarker : sideMarkers(awaySlots, false)) : sideMarkers(awaySlots, false);

  const markerById = new Map<string, { x: number; y: number }>();
  for (const m of [...homeMarkers, ...awayMarkers]) markerById.set(m.id, { x: m.x, y: m.y });
  const lastWithMarker = [...revealed].reverse().find((e) => e.playerId && markerById.has(e.playerId));
  const activeMarkerPos = lastWithMarker?.playerId ? markerById.get(lastWithMarker.playerId) : undefined;

  const lastPositional = [...revealed].reverse().find((e) => e.zone);
  const ballX = activeMarkerPos?.x ?? (lastPositional?.zone === "left" ? 14 : lastPositional?.zone === "right" ? 86 : 50);
  const ballY = activeMarkerPos?.y ?? (lastPositional ? 28 + ((lastPositional.minute * 53) % 44) : 50);

  return { homeMarkers, awayMarkers, ballX, ballY };
}

/** Most recent rally point score carried on a revealed event (volleyball/pickleball), or null before any point has been stamped. */
export function liveRallyScore(events: MatchEvent[]): { home: number; away: number } | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.homePoints != null && e.awayPoints != null) return { home: e.homePoints, away: e.awayPoints };
  }
  return null;
}

/**
 * Maps a formation slot (x across, y up the pitch toward the opponent) onto the
 * horizontal live-viewer venue (0-100% in both axes, home on the left half, away
 * on the right). Baseball's diamond uses absolute slot coordinates directly since
 * there's no shared halfway line between the two sides.
 */
export function slotToVenuePos(
  venue: MatchPresentation["venue"],
  slot: { x: number; y: number },
  isHome: boolean,
): { x: number; y: number } {
  if (venue === "diamond") return { x: slot.x, y: slot.y };
  const depth = (slot.y / 100) * 50;
  return { x: isHome ? depth : 100 - depth, y: slot.x };
}

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
