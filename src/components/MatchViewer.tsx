"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Club, LocalizedText, MatchEvent, MatchPresentation, MatchResult, Player, SportId, Tactics } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSport } from "@/lib/sports";
import { progressPerSecond } from "@/lib/sports/playback";
import { useGameStore } from "@/lib/store/gameStore";
import { playerDisplayName, clubDisplayName } from "@/lib/utils/format";
import { Tile, conditionColor, ratingColor } from "./Tile";
import { Venue, VenueSurface, venueFrameClass } from "./Venue";

const SPEEDS = [0.5, 1, 2, 4, 8, 16];
const MENTALITY: Tactics["mentality"][] = ["defensive", "balanced", "attacking"];
const TEMPO: Tactics["tempo"][] = ["slow", "normal", "fast"];
const PRESSING: Tactics["pressing"][] = ["low", "medium", "high"];
const WIDTH: Tactics["width"][] = ["narrow", "normal", "wide"];
const TACTIC_PRESETS: { name: string; patch: Partial<Tactics> }[] = [
  { name: "점유 안정", patch: { mentality: "balanced", tempo: "slow", pressing: "medium", width: "narrow" } },
  { name: "강한 압박", patch: { mentality: "attacking", tempo: "fast", pressing: "high", width: "normal" } },
  { name: "측면 공략", patch: { mentality: "attacking", tempo: "normal", pressing: "medium", width: "wide" } },
  { name: "역습 대기", patch: { mentality: "defensive", tempo: "fast", pressing: "low", width: "wide" } },
  { name: "잠그기", patch: { mentality: "defensive", tempo: "slow", pressing: "low", width: "narrow" } },
  { name: "균형 운영", patch: { mentality: "balanced", tempo: "normal", pressing: "medium", width: "normal" } },
];

interface Props {
  result: MatchResult;
  home: Club;
  away: Club;
  players: Record<string, Player>;
  sportId: SportId;
}

interface SlotPlayer {
  pos: string;
  x: number;
  y: number;
  player?: Player;
}

type FeedItem =
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

function shortName(p: Player): string {
  if (p.nameKo) return p.nameKo;
  const parts = p.name.split(" ");
  return parts[parts.length - 1];
}

export function MatchViewer({ result, home, away, players, sportId }: Props) {
  const { t, tl } = useI18n();
  const gameState = useGameStore((s) => s.state);
  const setTactics = useGameStore((s) => s.setTactics);
  const setLineup = useGameStore((s) => s.setLineup);
  const autoPickLineup = useGameStore((s) => s.autoPickLineup);
  const sport = getSport(sportId);
  const pres = sport.matchPresentation;

  const lineupSlots = (club: Club): SlotPlayer[] => {
    const formation = sport.formations.find((f) => f.key === club.tactics.formation) ?? sport.formations[0];
    if (!formation) return [];
    let ids = club.tactics.lineup.filter((id) => players[id]);
    if (ids.length < formation.slots.length) ids = sport.autoPickLineup(club, players).lineup;
    return formation.slots.map((s, i) => ({ pos: s.position, x: s.x, y: s.y, player: players[ids[i]] }));
  };
  const homeSlots = useMemo(() => lineupSlots(home), [home, players, sport]); // eslint-disable-line react-hooks/exhaustive-deps
  const awaySlots = useMemo(() => lineupSlots(away), [away, players, sport]); // eslint-disable-line react-hooks/exhaustive-deps

  const endMinute = useMemo(
    () => Math.max(pres.endProgress, result.events.reduce((m, e) => Math.max(m, e.minute), pres.endProgress)),
    [result.events, pres.endProgress],
  );

  const [clock, setClock] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [activeBreak, setActiveBreak] = useState<LocalizedText | null>(null);
  const [activeBreakKind, setActiveBreakKind] = useState<"scheduled" | "timeout" | "substitution" | null>(null);
  const [timeoutsLeft, setTimeoutsLeft] = useState(3);
  const managedClub = gameState?.manager.clubId === home.id ? home : gameState?.manager.clubId === away.id ? away : null;
  const canAdjustTactics = Boolean(activeBreak && managedClub && activeBreakKind !== "substitution");
  const canManagePlayers = Boolean(activeBreak && managedClub);
  const canCallTimeout = Boolean(managedClub && sportId !== "soccer" && clock < endMinute && timeoutsLeft > 0);
  const canRequestSubstitution = Boolean(managedClub && clock < endMinute);

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
          setActiveBreakKind("scheduled");
          if (!managedClub) {
            breakTimer.current = window.setTimeout(() => {
              setActiveBreak(null);
              setActiveBreakKind(null);
              setPlaying(true);
            }, 2200);
          }
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
  }, [playing, speed, endMinute, pres, managedClub]);

  useEffect(() => () => { if (breakTimer.current) clearTimeout(breakTimer.current); }, []);

  function clearBreak() {
    if (breakTimer.current) {
      clearTimeout(breakTimer.current);
      breakTimer.current = null;
    }
    setActiveBreak(null);
    setActiveBreakKind(null);
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
  function callTimeout() {
    if (!managedClub || sportId === "soccer" || timeoutsLeft <= 0 || clockRef.current >= endMinute) return;
    setTimeoutsLeft((n) => Math.max(0, n - 1));
    setPlaying(false);
    setActiveBreak({ ko: "작전타임", en: "Timeout" });
    setActiveBreakKind("timeout");
  }
  function requestSubstitution() {
    if (!managedClub || clockRef.current >= endMinute) return;
    setPlaying(false);
    setActiveBreak({ ko: "선수 교체", en: "Substitution" });
    setActiveBreakKind("substitution");
  }

  const finished = clock >= endMinute;
  const revealed = useMemo(() => result.events.filter((e) => e.minute <= clock), [result.events, clock]);
  const homeScore = pres.scoreOf(revealed, home.id);
  const awayScore = pres.scoreOf(revealed, away.id);
  const liveStats = pres.liveStats(revealed, home.id, away.id);
  const pens = revealed.find((e) => e.type === "penalty_shootout");

  const ratingOf = (pid: string): number => {
    const final = result.playerRatings[pid] ?? 6.6;
    const prog = Math.min(1, clock / endMinute);
    return Math.round((6.6 + (final - 6.6) * prog) * 10) / 10;
  };

  const lastPositional = [...revealed].reverse().find((e) => e.zone);
  const ballX = lastPositional?.zone === "left" ? 14 : lastPositional?.zone === "right" ? 86 : 50;
  const ballY = lastPositional ? 28 + ((lastPositional.minute * 53) % 44) : 50;

  const last = revealed[revealed.length - 1];
  const newestScore =
    last && pres.eventMeta(last.type).tone === "score" && clock - last.minute < 3 ? last : null;
  const scoreFlash = newestScore ? pres.eventMeta(newestScore.type).label : null;

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    for (const ev of result.events) if (ev.minute <= clock) items.push({ kind: "event", minute: ev.minute, ev });
    items.push({ kind: "marker", minute: 0, label: { ko: "킥오프", en: "Kick-off" } });
    for (const b of pres.breaks) if (b.at <= clock) items.push({ kind: "marker", minute: b.at, label: b.label });
    if (finished) items.push({ kind: "marker", minute: endMinute, label: { ko: "경기 종료", en: "Full Time" } });
    items.sort((a, b) => b.minute - a.minute || (a.kind === "marker" ? 1 : -1));
    return items;
  }, [result.events, pres.breaks, clock, finished, endMinute]);

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

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-2 sm:p-3">
      {/* Top control / scoreboard bar */}
      <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel)]/95 px-4 py-2.5 backdrop-blur">
        <span className="hidden text-sm text-zinc-500 sm:inline">{tl(sport.name)}</span>
        <div className="flex items-center gap-3">
          <span className="max-w-[26vw] truncate text-right text-sm font-semibold">{home.shortName}</span>
          <span className={`rounded-md px-3 py-1 text-lg font-bold tabular-nums ${newestScore ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"}`}>
            {homeScore} - {awayScore}
          </span>
          <span className="max-w-[26vw] truncate text-left text-sm font-semibold">{away.shortName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-sm text-soft">
            {!finished && !activeBreak && <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" />}
            {clockLabel}
          </span>
          <button onClick={togglePlay} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
            {playing ? "⏸" : "▶"}
          </button>
        </div>
      </div>
      {pens && (
        <p className="-mt-2 text-center text-xs text-zinc-500">
          {clubDisplayName(home)} {result.homePens} - {result.awayPens} {clubDisplayName(away)} · {t("afterPenalties")}
        </p>
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
              />
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full bg-blue-500 transition-[width] duration-200" style={{ width: `${(clock / endMinute) * 100}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={togglePlay} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
                {playing ? `⏸ ${t("pause")}` : `▶ ${t("play")}`}
              </button>
              <button onClick={restart} className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">↺</button>
              <button onClick={skip} className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">⏭ {t("skipToEnd")}</button>
              {managedClub && (
                <button
                  onClick={requestSubstitution}
                  disabled={!canRequestSubstitution}
                  className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                >
                  ⇄ 교체
                </button>
              )}
              {sportId !== "soccer" && managedClub && (
                <button
                  onClick={callTimeout}
                  disabled={!canCallTimeout}
                  className="rounded-md border border-amber-300 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
                >
                  ⏱ 작전타임 {timeoutsLeft}
                </button>
              )}
              <div className="ml-auto flex items-center gap-1">
                <span className="mr-1 text-xs text-soft">{t("speed")}</span>
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`rounded-md px-2 py-1 text-xs tabular-nums ${speed === s ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black" : "border hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </Tile>

          <div className="grid min-h-0 flex-1 gap-3 overflow-hidden sm:grid-cols-2">
            <Tile title={t("matchStats")}>
              <div className="flex flex-col gap-2">
                {liveStats.map((row, i) => (
                  <StatRow key={i} label={tl(row.label)} h={row.h} a={row.a} suffix={row.suffix} />
                ))}
                {liveStats.length === 0 && <p className="text-sm text-zinc-400">—</p>}
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
                <span className="w-full truncate text-[11px]">{shortName(p)}</span>
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
                <span className="w-9 shrink-0 text-right font-mono text-xs text-zinc-500">{ev.minute}</span>
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
            <Tile title={tl(activeBreak)} className="bg-white dark:bg-zinc-900">
              <div className="mb-3 text-center text-3xl font-bold tabular-nums">{homeScore} - {awayScore}</div>
              {liveStats.length > 0 && (
                <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
                  {liveStats.slice(0, 3).map((row, i) => (
                    <MiniStat key={i} label={tl(row.label)} v={`${row.h}-${row.a}`} />
                  ))}
                </div>
              )}
              {canAdjustTactics && managedClub && (
                <InlineTacticsPanel
                  tactics={managedClub.tactics}
                  formations={sport.formations.map((f) => f.key)}
                  club={managedClub}
                  players={players}
                  calcOverall={sport.calcOverall}
                  allowTactics={canAdjustTactics}
                  t={t}
                  onPatch={setTactics}
                  onAutoPick={autoPickLineup}
                  onLineupChange={setLineup}
                />
              )}
              {!canAdjustTactics && canManagePlayers && managedClub && (
                <InlineTacticsPanel
                  tactics={managedClub.tactics}
                  formations={sport.formations.map((f) => f.key)}
                  club={managedClub}
                  players={players}
                  calcOverall={sport.calcOverall}
                  allowTactics={false}
                  t={t}
                  onPatch={setTactics}
                  onAutoPick={autoPickLineup}
                  onLineupChange={setLineup}
                />
              )}
              <h4 className="mb-1 text-xs font-semibold uppercase text-zinc-400">{t("ratings")}</h4>
              <div className="flex flex-col gap-1">
                {topPerformers.map(({ p, r }) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <PlayerNameLink player={p} />
                    <span className={`rounded px-1.5 text-xs font-bold ${ratingColor(r)}`}>{r.toFixed(1)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { clearBreak(); setPlaying(true); }} className="mt-4 w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                ▶ {t("play")}
              </button>
            </Tile>
          </div>
        </div>
      )}

    </div>
  );
}

function PlayerNameLink({ player, className = "font-medium text-foreground hover:text-[var(--accent)]", label }: { player: Player; className?: string; label?: string }) {
  return (
    <Link href={`/game/squad/${player.id}`} className={className} title={playerDisplayName(player)}>
      {label ?? playerDisplayName(player)}
    </Link>
  );
}

function RatingsPanel({ title, ratings }: { title: string; ratings: { p: Player; r: number }[] }) {
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

function BroadcastFeed({
  title,
  feed,
  players,
  home,
  away,
  pres,
  tl,
  t,
}: {
  title: string;
  feed: FeedItem[];
  players: Record<string, Player>;
  home: Club;
  away: Club;
  pres: MatchPresentation;
  tl: (text: LocalizedText) => string;
  t: (key: never) => string;
}) {
  return (
    <Tile title={title} className="flex h-full min-h-0 flex-col" bodyClassName="min-h-0">
      <div className="flex h-full min-h-0 flex-col-reverse gap-2 overflow-y-auto pr-1 text-sm">
        {feed.length === 0 && <p className="text-zinc-400">—</p>}
        {feed.map((item, i) => {
          if (item.kind === "marker") {
            return (
              <div key={`m${i}`} className="my-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-soft">
                <span className="h-px flex-1 bg-[var(--line)]" />
                {tl(item.label)}
                <span className="h-px flex-1 bg-[var(--line)]" />
              </div>
            );
          }
          const ev = item.ev;
          const meta = pres.eventMeta(ev.type);
          const player = ev.playerId ? players[ev.playerId] : null;
          const assist = ev.assistId ? players[ev.assistId] : null;
          const club = home.id === ev.clubId ? home : away;
          const important = meta.tone === "score" || meta.tone === "danger";
          return (
            <div key={`e${i}`} className={`rounded-lg border px-3 py-2 ${toneRing(meta.tone)} ${important ? "shadow-sm" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="w-10 shrink-0 text-right font-mono text-xs text-soft">{ev.minute}</span>
                <span className="shrink-0">{meta.emoji}</span>
                <span className={`truncate ${important ? "font-bold" : "font-semibold"}`}>{tl(meta.label)}</span>
                <span className="ml-auto max-w-[35%] truncate text-xs text-soft">{club.shortName}</span>
              </div>
              <div className="mt-1 pl-14 text-sm leading-snug">
                {ev.detail ? <span className="text-zinc-700 dark:text-zinc-200">{tl(ev.detail)}</span> : null}
                {player && (
                  <span className="ml-1">
                    <PlayerNameLink player={player} />
                  </span>
                )}
                {assist && <span className="text-xs text-soft"> ({t("assist" as never)}: <PlayerNameLink player={assist} className="hover:text-[var(--accent)]" />)</span>}
              </div>
            </div>
          );
        })}
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
              <PlayerNameLink player={p} className="mt-0.5 max-w-[52px] truncate rounded bg-black/40 px-1 text-[9px] text-white hover:bg-black/60" label={shortName(p)} />
              <span className={`rounded px-1 text-[9px] font-bold ${ratingColor(r)}`}>{r.toFixed(1)}</span>
              <span className={`text-[9px] ${conditionColor(p.condition)}`} title={t("condition")}>♥{Math.round(p.condition)}</span>
            </div>
          );
        })}
      </div>
    </Tile>
  );
}

function StatRow({ label, h, a, suffix = "" }: { label: string; h: number; a: number; suffix?: string }) {
  const total = h + a || 1;
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="font-semibold tabular-nums">{h}{suffix}</span>
        <span className="text-zinc-500">{label}</span>
        <span className="font-semibold tabular-nums">{a}{suffix}</span>
      </div>
      <div className="mt-0.5 flex h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="bg-blue-500" style={{ width: `${(h / total) * 100}%` }} />
        <div className="ml-auto bg-rose-400" style={{ width: `${(a / total) * 100}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 py-1.5 dark:border-zinc-800">
      <div className="text-sm font-bold tabular-nums">{v}</div>
      <div className="text-[10px] text-zinc-500">{label}</div>
    </div>
  );
}

function InlineTacticsPanel({
  tactics,
  formations,
  club,
  players,
  calcOverall,
  allowTactics,
  t,
  onPatch,
  onAutoPick,
  onLineupChange,
}: {
  tactics: Tactics;
  formations: string[];
  club: Club;
  players: Record<string, Player>;
  calcOverall: (player: Player) => number;
  allowTactics: boolean;
  t: (k: never) => string;
  onPatch: (patch: Partial<Tactics>) => void;
  onAutoPick: () => void;
  onLineupChange: (lineup: string[], bench: string[]) => void;
}) {
  const lineupIds = tactics.lineup.filter((id) => players[id]);
  const benchIds = tactics.bench.filter((id) => players[id] && !lineupIds.includes(id));
  const fallbackBenchIds = club.squad.filter((id) => players[id] && !lineupIds.includes(id) && !benchIds.includes(id));
  const selectableBenchIds = benchIds.length > 0 ? benchIds : fallbackBenchIds;
  const [outId, setOutId] = useState(lineupIds[0] ?? "");
  const [inId, setInId] = useState(selectableBenchIds[0] ?? "");
  const selectedOutId = lineupIds.includes(outId) ? outId : lineupIds[0] ?? "";
  const selectedInId = selectableBenchIds.includes(inId) ? inId : selectableBenchIds[0] ?? "";

  function labelFor(id: string) {
    const player = players[id];
    if (!player) return id;
    return `${playerDisplayName(player)} · ${player.positions[0]} · ${calcOverall(player)}`;
  }

  function applySubstitution() {
    if (!selectedOutId || !selectedInId || selectedOutId === selectedInId || !lineupIds.includes(selectedOutId)) return;
    const nextLineup = tactics.lineup.map((id) => (id === selectedOutId ? selectedInId : id));
    const nextBench = Array.from(new Set([...tactics.bench.filter((id) => id !== selectedInId), selectedOutId]))
      .filter((id) => players[id] && !nextLineup.includes(id));
    onLineupChange(nextLineup, nextBench);
  }

  return (
    <div className="mb-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      {allowTactics && (
        <>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase text-zinc-400">{t("tactics" as never)}</h4>
            <button onClick={onAutoPick} className="rounded-md border px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900">
              {t("autoPick" as never)}
            </button>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-1.5">
            {TACTIC_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onPatch(preset.patch)}
                className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <BreakSelect label={t("formation" as never)} value={tactics.formation} options={formations} onChange={(formation) => onPatch({ formation })} />
            <BreakSelect label={t("mentality" as never)} value={tactics.mentality} options={MENTALITY} onChange={(mentality) => onPatch({ mentality: mentality as Tactics["mentality"] })} t={t} />
            <BreakSelect label={t("tempo" as never)} value={tactics.tempo} options={TEMPO} onChange={(tempo) => onPatch({ tempo: tempo as Tactics["tempo"] })} t={t} />
            <BreakSelect label={t("pressing" as never)} value={tactics.pressing} options={PRESSING} onChange={(pressing) => onPatch({ pressing: pressing as Tactics["pressing"] })} t={t} />
            <BreakSelect label={t("width" as never)} value={tactics.width} options={WIDTH} onChange={(width) => onPatch({ width: width as Tactics["width"] })} t={t} />
          </div>
        </>
      )}
      <div className={allowTactics ? "mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800" : ""}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase text-zinc-400">선수 교체</h4>
          <span className="text-[11px] text-soft">라인업 {lineupIds.length}명 · 후보 {selectableBenchIds.length}명</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <BreakSelect label="OUT" value={selectedOutId} options={lineupIds} onChange={setOutId} formatter={labelFor} />
          <BreakSelect label="IN" value={selectedInId} options={selectableBenchIds} onChange={setInId} formatter={labelFor} />
          <button
            onClick={applySubstitution}
            disabled={!selectedOutId || !selectedInId || selectedOutId === selectedInId}
            className="self-end rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            교체 적용
          </button>
        </div>
      </div>
    </div>
  );
}

function BreakSelect({
  label,
  value,
  options,
  onChange,
  t,
  formatter,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  t?: (k: never) => string;
  formatter?: (value: string) => string;
}) {
  return (
    <label className="flex flex-col gap-1 text-left text-xs text-zinc-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatter ? formatter(option) : t ? t(option as never) : option}
          </option>
        ))}
      </select>
    </label>
  );
}
