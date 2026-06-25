"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Club, LocalizedText, MatchEvent, MatchPresentation, MatchResult, Player, SportId } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSport } from "@/lib/sports";
import { buildLiveVenue, feedToneRankFloor, liveRallyScore, lineupSlots, momentumBuckets, progressPerSecond, toneRank, type SlotPlayer } from "@/lib/sports/playback";
import { playerDisplayName, clubDisplayName, playerShortName } from "@/lib/utils/format";
import { Avatar, Tile, conditionColor, ratingColor } from "./Tile";
import { Venue, VenueSurface, venueFrameClass } from "./Venue";

const SPEEDS = [0.5, 1, 2, 4, 8, 16];

interface Props {
  result: MatchResult;
  home: Club;
  away: Club;
  players: Record<string, Player>;
  sportId: SportId;
}

export type FeedItem =
  | { kind: "event"; minute: number; ev: MatchEvent }
  | { kind: "marker"; minute: number; label: LocalizedText };

function toneRing(tone?: string): string {
  switch (tone) {
    case "score": return "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40";
    case "danger": return "border-rose-400 bg-rose-50 dark:bg-rose-950/30";
    case "warn": return "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20";
    case "info": return "border-sky-300 bg-sky-50/50 dark:bg-sky-950/20";
    default: return "border-zinc-200 dark:border-zinc-800";
  }
}

/** Cosmetic-only accent color per event tone, used by the dark-theme BroadcastFeed. */
function toneAccent(tone?: string): string {
  switch (tone) {
    case "score": return "var(--mint)";
    case "danger": return "var(--red)";
    case "warn": return "var(--gold)";
    case "info": return "var(--blue)";
    default: return "var(--muted-3)";
  }
}

export { playerShortName as shortName };

export function MatchViewer({ result, home, away, players, sportId }: Props) {
  const { t, tl } = useI18n();
  const sport = getSport(sportId);
  const pres = sport.matchPresentation;

  const homeSlots = useMemo(() => lineupSlots(sport, home, players), [sport, home, players]);
  const awaySlots = useMemo(() => lineupSlots(sport, away, players), [sport, away, players]);

  const endMinute = useMemo(
    () => Math.max(pres.endProgress, result.events.reduce((m, e) => Math.max(m, e.minute), pres.endProgress)),
    [result.events, pres.endProgress],
  );

  const [clock, setClock] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [activeBreak, setActiveBreak] = useState<LocalizedText | null>(null);

  const clockRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const shownBreaks = useRef<Set<number>>(new Set());
  const breakTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    lastRef.current = null;
    let raf = 0;
    const tick = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = now - lastRef.current;
      lastRef.current = now;
      let nc = clockRef.current + (dt / 1000) * progressPerSecond(pres, speed);

      for (let bi = 0; bi < pres.breaks.length; bi++) {
        const b = pres.breaks[bi];
        if (!shownBreaks.current.has(bi) && clockRef.current < b.at && nc >= b.at) {
          nc = b.at;
          shownBreaks.current.add(bi);
          clockRef.current = nc;
          setClock(nc);
          setPlaying(false);
          setActiveBreak(b.label);
          breakTimer.current = window.setTimeout(() => {
            setActiveBreak(null);
            setPlaying(true);
          }, 2200);
          return;
        }
      }

      let stop = false;
      if (nc >= endMinute) {
        nc = endMinute;
        stop = true;
      }
      clockRef.current = nc;
      setClock(nc);
      if (stop) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, endMinute, pres]);

  useEffect(() => () => { if (breakTimer.current) clearTimeout(breakTimer.current); }, []);

  function clearBreak() {
    if (breakTimer.current) {
      clearTimeout(breakTimer.current);
      breakTimer.current = null;
    }
    setActiveBreak(null);
  }
  function togglePlay() {
    clearBreak();
    if (clockRef.current >= endMinute) {
      clockRef.current = 0;
      shownBreaks.current = new Set();
      setClock(0);
      setPlaying(true);
    } else setPlaying((p) => !p);
  }
  function restart() {
    clearBreak();
    clockRef.current = 0;
    shownBreaks.current = new Set();
    setClock(0);
    setPlaying(true);
  }
  function skip() {
    clearBreak();
    clockRef.current = endMinute;
    pres.breaks.forEach((_, i) => shownBreaks.current.add(i));
    setClock(endMinute);
    setPlaying(false);
  }
  const finished = clock >= endMinute;
  const revealed = useMemo(() => result.events.filter((e) => e.minute <= clock), [result.events, clock]);
  const homeScore = pres.scoreOf(revealed, home.id);
  const awayScore = pres.scoreOf(revealed, away.id);
  const liveStats = pres.liveStats(revealed, home.id, away.id);
  const pens = revealed.find((e) => e.type === "penalty_shootout");

  const momentum = useMemo(
    () => momentumBuckets(revealed, clock, endMinute, home.id, away.id, pres),
    [revealed, endMinute, clock, home.id, away.id, pres],
  );

  const ratingOf = (pid: string): number => {
    const final = result.playerRatings[pid] ?? 6.6;
    const prog = Math.min(1, clock / endMinute);
    return Math.round((6.6 + (final - 6.6) * prog) * 10) / 10;
  };

  const last = revealed[revealed.length - 1];

  const { homeMarkers, awayMarkers, ballX, ballY } = useMemo(
    () => buildLiveVenue(pres, revealed, homeSlots, awaySlots, players, home.id, away.id, clock),
    [pres, revealed, homeSlots, awaySlots, players, home.id, away.id, clock],
  );

  const newestScore =
    last && pres.eventMeta(last.type).tone === "score" && clock - last.minute < 3 ? last : null;
  const scoreFlash = newestScore ? pres.eventMeta(newestScore.type).label : null;

  const liveRally = liveRallyScore(revealed);

  const feed = useMemo<FeedItem[]>(() => {
    const minRank = feedToneRankFloor(speed);
    const items: FeedItem[] = [];
    for (const ev of result.events) {
      if (ev.minute > clock) continue;
      if (toneRank(pres.eventMeta(ev.type).tone) < minRank) continue;
      items.push({ kind: "event", minute: ev.minute, ev });
    }
    items.push({ kind: "marker", minute: 0, label: pres.openLabel });
    for (const b of pres.breaks) if (b.at <= clock) items.push({ kind: "marker", minute: b.at, label: b.label });
    if (finished) items.push({ kind: "marker", minute: endMinute, label: { ko: "경기 종료", en: "Full Time" } });
    items.sort((a, b) => b.minute - a.minute || (a.kind === "marker" ? 1 : -1));
    return items;
  }, [result.events, pres, clock, finished, endMinute, speed]);

  const topPerformers = useMemo(
    () =>
      [...homeSlots, ...awaySlots]
        .map((s) => s.player)
        .filter((p): p is Player => !!p)
        .map((p) => ({ p, r: ratingOf(p.id) }))
        .sort((a, b) => b.r - a.r)
        .slice(0, 3),
    [homeSlots, awaySlots, clock], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const clockLabel = activeBreak ? tl(activeBreak) : finished ? t("fullTime") : pres.clockLabel(clock, endMinute, false);

  // Segment (quarter/set/inning/game) scores reveal in step with overall
  // match progress, mirroring how the running score is revealed by clock.
  const revealedSegmentCount = result.segmentScores
    ? finished
      ? result.segmentScores.length
      : Math.min(result.segmentScores.length, Math.max(1, Math.ceil((clock / endMinute) * result.segmentScores.length)))
    : 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-2 sm:p-3">
      {/* Top scoreboard bar */}
      <div
        className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-3.5"
        style={{ borderColor: "var(--line)", background: "linear-gradient(120deg,#10243a,#0d1727)" }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar initials={home.shortName.slice(0, 2).toUpperCase()} color="var(--blue)" size={40} rounded="11px" />
          <span className="truncate text-[13px] font-semibold">{home.shortName}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 px-3">
          <span className="flex items-center gap-[7px] text-[11px] font-bold" style={{ color: "var(--red)" }}>
            {!finished && !activeBreak && <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full" style={{ background: "var(--red)" }} />}
            {finished || activeBreak ? clockLabel : `${t("live")} ${clockLabel}`}
          </span>
          <span className="font-display text-[36px] font-bold leading-none tabular-nums" style={{ color: newestScore ? "var(--mint)" : "var(--text)" }}>
            {homeScore} <span style={{ color: "var(--muted-3)" }}>:</span> {awayScore}
          </span>
          {liveRally && !finished && (
            <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--muted-3)" }}>
              {liveRally.home}-{liveRally.away}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <span className="truncate text-right text-[13px] font-semibold">{away.shortName}</span>
          <Avatar initials={away.shortName.slice(0, 2).toUpperCase()} color="var(--red)" size={40} rounded="11px" />
        </div>
        <button
          onClick={togglePlay}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold"
          style={{ color: "#06140e", background: "var(--mint)" }}
        >
          {playing ? "⏸" : "▶"}
        </button>
      </div>
      {pens && (
        <p className="-mt-2 text-center text-xs" style={{ color: "var(--muted-3)" }}>
          {clubDisplayName(home)} {result.homePens} - {result.awayPens} {clubDisplayName(away)} · {t("afterPenalties")}
        </p>
      )}

      {result.segmentScores && result.segmentScores.length > 0 && (
        <div
          className="flex shrink-0 items-stretch gap-1.5 overflow-x-auto rounded-xl border px-2.5 py-2"
          style={{ borderColor: "var(--line)", background: "var(--panel-2)" }}
        >
          {result.segmentScores.map((seg, i) => {
            const revealed = i < revealedSegmentCount;
            return (
              <div
                key={i}
                className="flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2.5 py-1"
                style={{ background: "var(--panel)", minWidth: 52 }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>
                  {tl(seg.label)}
                </span>
                <span className="font-mono text-[12px] font-bold tabular-nums">
                  {revealed ? `${seg.homeScore}-${seg.awayScore}` : "–"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
        <div className="hidden">
          <FormationTile title={`${home.shortName} · ${t("formation")}`} slots={homeSlots} attackUp ratingOf={ratingOf} t={t} venue={pres.venue} />
        </div>

        <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <Tile title={t("watchMatch")} action={<span className="font-mono text-xs text-soft">{clockLabel}</span>} className="min-h-0 shrink-0">
            <div className="mx-auto w-full max-w-3xl">
              <Venue
                venue={pres.venue}
                ballX={ballX}
                ballY={ballY}
                homeShort={home.shortName}
                awayShort={away.shortName}
                flash={scoreFlash ? tl(scoreFlash) : null}
                homeMarkers={homeMarkers}
                awayMarkers={awayMarkers}
              />
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.08)" }}>
              <div className="h-full transition-[width] duration-200" style={{ width: `${(clock / endMinute) * 100}%`, background: "var(--blue)" }} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={togglePlay}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold"
                style={{ color: "#06140e", background: "var(--mint)" }}
              >
                {playing ? `⏸ ${t("pause")}` : `▶ ${t("play")}`}
              </button>
              <button
                onClick={restart}
                className="rounded-lg border px-3 py-1.5 text-sm"
                style={{ borderColor: "var(--border-soft)", color: "var(--muted-2)" }}
              >
                ↺
              </button>
              <button
                onClick={skip}
                className="rounded-lg border px-3 py-1.5 text-sm"
                style={{ borderColor: "var(--border-soft)", color: "var(--muted-2)" }}
              >
                ⏭ {t("skipToEnd")}
              </button>
              <div className="ml-auto flex items-center gap-1">
                <span className="mr-1 text-xs" style={{ color: "var(--muted-2)" }}>{t("speed")}</span>
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className="rounded-md px-2 py-1 text-xs tabular-nums"
                    style={
                      speed === s
                        ? { color: "#06140e", background: "var(--mint)" }
                        : { color: "var(--muted-2)", background: "rgba(255,255,255,.05)" }
                    }
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </Tile>

          <MomentumBar buckets={momentum} homeShort={home.shortName} awayShort={away.shortName} title={t("momentum")} />

          <div className="grid min-h-0 flex-1 gap-3 overflow-hidden sm:grid-cols-2">
            <Tile title={t("matchStats")}>
              <div className="flex flex-col gap-2">
                {liveStats.map((row, i) => (
                  <StatRow key={i} label={tl(row.label)} h={row.h} a={row.a} suffix={row.suffix} />
                ))}
                {liveStats.length === 0 && <p className="text-sm" style={{ color: "var(--muted-3)" }}>—</p>}
              </div>
            </Tile>
            <RatingsPanel title={t("ratings")} ratings={topPerformers} />
          </div>
        </div>

        <div className="min-h-0 overflow-hidden">
          <BroadcastFeed
            title={t("matchEvents")}
            feed={feed}
            players={players}
            home={home}
            away={away}
            pres={pres}
            endMinute={endMinute}
            tl={tl}
            t={t}
          />
        </div>
      </div>

      <Tile title={`${clubDisplayName(home)} · ${t("squad")}`} bodyClassName="overflow-x-auto" className="hidden">
        <div className="flex min-w-max gap-2">
          {homeSlots.map((s, i) => {
            if (!s.player) return null;
            const p = s.player;
            const r = ratingOf(p.id);
            return (
              <div key={i} className="flex w-16 flex-col items-center gap-1 rounded-lg border border-zinc-100 p-1.5 text-center dark:border-zinc-800" title={playerDisplayName(p)}>
                <span className="text-[10px] font-semibold text-zinc-400">{s.pos}</span>
                <span className="w-full truncate text-[11px]">{playerShortName(p)}</span>
                <span className={`text-xs ${conditionColor(p.condition)}`}>♥ {Math.round(p.condition)}</span>
                <span className={`rounded px-1.5 text-xs font-bold tabular-nums ${ratingColor(r)}`}>{r.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </Tile>

      <Tile title={t("commentary")} className="hidden">
        <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
          {feed.map((item, i) => {
            if (item.kind === "marker") {
              return (
                <div key={`m${i}`} className="my-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  {tl(item.label)}
                  <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </div>
              );
            }
            const ev = item.ev;
            const meta = pres.eventMeta(ev.type);
            const player = ev.playerId ? players[ev.playerId] : null;
            const assist = ev.assistId ? players[ev.assistId] : null;
            return (
              <div key={`e${i}`} className={`flex items-start gap-2 rounded-md border px-3 py-1.5 text-sm ${toneRing(meta.tone)}`}>
                <span className="shrink-0">{meta.emoji}</span>
                <span className="flex-1">
                  <span className="font-semibold">{tl(meta.label)}</span>
                  {ev.detail ? <span className="text-zinc-600 dark:text-zinc-300"> · {tl(ev.detail)}</span> : null}
                  {player && <span className="ml-1 font-medium">— {playerDisplayName(player)}</span>}
                  {assist && <span className="text-xs text-zinc-500"> ({t("assist")}: {playerDisplayName(assist)})</span>}
                </span>
              </div>
            );
          })}
          {feed.length === 0 && <p className="text-sm text-zinc-400">…</p>}
        </div>
      </Tile>

      {/* Break card (between-highlights screen) */}
      {activeBreak && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4" onClick={() => { clearBreak(); setPlaying(true); }}>
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <Tile title={tl(activeBreak)}>
              <div className="font-display mb-3 text-center text-3xl font-bold tabular-nums">{homeScore} - {awayScore}</div>
              {liveStats.length > 0 && (
                <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
                  {liveStats.slice(0, 3).map((row, i) => (
                    <MiniStat key={i} label={tl(row.label)} v={`${row.h}-${row.a}`} />
                  ))}
                </div>
              )}
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>{t("ratings")}</h4>
              <div className="flex flex-col gap-1">
                {topPerformers.map(({ p, r }) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <PlayerNameLink player={p} />
                    <span className={`rounded px-1.5 text-xs font-bold ${ratingColor(r)}`}>{r.toFixed(1)}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { clearBreak(); setPlaying(true); }}
                className="mt-4 w-full rounded-lg py-2 text-sm font-semibold"
                style={{ color: "#06140e", background: "var(--mint)" }}
              >
                ▶ {t("play")}
              </button>
            </Tile>
          </div>
        </div>
      )}

    </div>
  );
}

export function PlayerNameLink({ player, className = "font-medium text-foreground hover:text-[var(--accent)]", label }: { player: Player; className?: string; label?: string }) {
  return (
    <Link href={`/game/squad/${player.id}`} className={className} title={playerDisplayName(player)}>
      {label ?? playerDisplayName(player)}
    </Link>
  );
}

export function RatingsPanel({ title, ratings }: { title: string; ratings: { p: Player; r: number }[] }) {
  return (
    <Tile title={title}>
      <div className="flex flex-col gap-1.5">
        {ratings.map(({ p, r }) => (
          <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm">
            <PlayerNameLink player={p} className="min-w-0 truncate font-medium hover:text-[var(--accent)]" />
            <span className={`shrink-0 rounded px-1.5 font-bold tabular-nums ${ratingColor(r)}`}>{r.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </Tile>
  );
}

export function BroadcastFeed({
  title,
  feed,
  players,
  home,
  away,
  pres,
  endMinute,
  tl,
  t,
}: {
  title: string;
  feed: FeedItem[];
  players: Record<string, Player>;
  home: Club;
  away: Club;
  pres: MatchPresentation;
  endMinute: number;
  tl: (text: LocalizedText) => string;
  t: (key: never) => string;
}) {
  return (
    <Tile title={title} className="flex h-full min-h-0 flex-col" bodyClassName="min-h-0">
      <div className="flex h-full min-h-0 flex-col-reverse gap-0.5 overflow-y-auto pr-1 text-sm">
        {feed.length === 0 && <p style={{ color: "var(--muted-3)" }}>—</p>}
        {feed.map((item, i) => {
          if (item.kind === "marker") {
            return (
              <div key={`m${i}`} className="my-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>
                <span className="h-px flex-1" style={{ background: "var(--line)" }} />
                {tl(item.label)}
                <span className="h-px flex-1" style={{ background: "var(--line)" }} />
              </div>
            );
          }
          const ev = item.ev;
          const meta = pres.eventMeta(ev.type);
          const player = ev.playerId ? players[ev.playerId] : null;
          const assist = ev.assistId ? players[ev.assistId] : null;
          const club = home.id === ev.clubId ? home : away;
          const important = meta.tone === "score" || meta.tone === "danger";
          const accent = toneAccent(meta.tone);
          return (
            <div key={`e${i}`} className="flex gap-3 border-b px-1.5 py-2.5" style={{ borderColor: "rgba(255,255,255,.04)" }}>
              <span className="font-display shrink-0 whitespace-nowrap text-[13px] font-bold" style={{ color: accent, minWidth: 32 }}>
                {pres.clockLabel(ev.minute, endMinute, false)}
              </span>
              <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0">{meta.emoji}</span>
                  <span className={`truncate text-[12.5px] ${important ? "font-bold" : "font-semibold"}`}>{tl(meta.label)}</span>
                  <span className="ml-auto max-w-[35%] truncate text-[10.5px]" style={{ color: "var(--muted-3)" }}>{club.shortName}</span>
                </div>
                <div className="mt-0.5 text-[11.5px] leading-snug" style={{ color: "var(--muted-2)" }}>
                  {ev.detail ? <span>{tl(ev.detail)}</span> : null}
                  {player && (
                    <span className="ml-1 font-medium" style={{ color: "var(--text)" }}>
                      <PlayerNameLink player={player} />
                    </span>
                  )}
                  {assist && <span> ({t("assist" as never)}: <PlayerNameLink player={assist} className="hover:text-[var(--accent)]" />)</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Tile>
  );
}

export function MomentumBar({
  buckets,
  homeShort,
  awayShort,
  title,
}: {
  buckets: { homePct: number | null }[];
  homeShort: string;
  awayShort: string;
  title: string;
}) {
  return (
    <Tile className="shrink-0">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[12px] font-semibold" style={{ color: "var(--blue)" }}>{homeShort}</span>
        <span className="font-display text-[14px] font-bold">{title}</span>
        <span className="text-[12px] font-semibold" style={{ color: "var(--red)" }}>{awayShort}</span>
      </div>
      <div className="flex h-[44px] items-end gap-[3px]">
        {buckets.map((b, i) => (
          <div key={i} className="flex h-full flex-1 flex-col justify-end gap-[2px]">
            <div
              className="rounded-t-[3px]"
              style={{
                height: b.homePct == null ? 4 : `${Math.max(4, b.homePct)}%`,
                background: b.homePct == null ? "rgba(255,255,255,.06)" : "var(--blue)",
              }}
            />
            <div
              className="rounded-b-[3px]"
              style={{
                height: b.homePct == null ? 4 : `${Math.max(4, 100 - b.homePct)}%`,
                background: b.homePct == null ? "rgba(255,255,255,.06)" : "var(--red)",
              }}
            />
          </div>
        ))}
      </div>
    </Tile>
  );
}

function FormationTile({
  title,
  slots,
  attackUp,
  ratingOf,
  t,
  venue,
}: {
  title: string;
  slots: SlotPlayer[];
  attackUp: boolean;
  ratingOf: (id: string) => number;
  t: (k: "condition") => string;
  venue: MatchPresentation["venue"];
}) {
  return (
    <Tile title={title}>
      <div className={`relative aspect-[3/4] w-full overflow-hidden rounded-lg border ${venueFrameClass(venue)}`}>
        <VenueSurface venue={venue} />
        {slots.map((s, i) => {
          if (!s.player) return null;
          const p = s.player;
          const top = attackUp ? 100 - s.y : s.y;
          const r = ratingOf(p.id);
          return (
            <div
              key={i}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${s.x}%`, top: `${top}%` }}
              title={p.nameKo ? `${p.nameKo} (${p.name})` : p.name}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[9px] font-bold text-zinc-900 shadow ring-1 ring-black/20">{s.pos}</div>
              <PlayerNameLink player={p} className="mt-0.5 max-w-[52px] truncate rounded bg-black/40 px-1 text-[9px] text-white hover:bg-black/60" label={playerShortName(p)} />
              <span className={`rounded px-1 text-[9px] font-bold ${ratingColor(r)}`}>{r.toFixed(1)}</span>
              <span className={`text-[9px] ${conditionColor(p.condition)}`} title={t("condition")}>♥{Math.round(p.condition)}</span>
            </div>
          );
        })}
      </div>
    </Tile>
  );
}

export function StatRow({ label, h, a, suffix = "" }: { label: string; h: number; a: number; suffix?: string }) {
  const total = h + a || 1;
  return (
    <div>
      <div className="flex justify-between text-[12.5px]">
        <span className="font-display font-bold tabular-nums" style={{ color: "var(--blue)" }}>{h}{suffix}</span>
        <span style={{ color: "var(--muted-2)" }}>{label}</span>
        <span className="font-display font-bold tabular-nums" style={{ color: "var(--red)" }}>{a}{suffix}</span>
      </div>
      <div className="mt-1.5 flex h-1.5 gap-[3px] overflow-hidden rounded-full">
        <div className="rounded-l-full" style={{ width: `${(h / total) * 100}%`, background: "var(--blue)" }} />
        <div className="ml-auto rounded-r-full" style={{ width: `${(a / total) * 100}%`, background: "var(--red)" }} />
      </div>
    </div>
  );
}

export function MiniStat({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-lg border py-1.5" style={{ borderColor: "var(--border-soft)" }}>
      <div className="font-display text-sm font-bold tabular-nums">{v}</div>
      <div className="text-[10px]" style={{ color: "var(--muted-3)" }}>{label}</div>
    </div>
  );
}

