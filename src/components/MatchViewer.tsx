"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Club, MatchEvent, MatchEventType, MatchResult, Player, SportId } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSport } from "@/lib/sports";
import { playerDisplayName, clubDisplayName } from "@/lib/utils/format";
import { Tile, conditionColor, ratingColor } from "./Tile";

// 45 match-minutes are played in 10 real seconds at 1x speed.
const MIN_PER_SEC = 4.5;
const SPEEDS = [0.5, 1, 2, 4];

interface Props {
  result: MatchResult;
  home: Club;
  away: Club;
  players: Record<string, Player>;
  sportId: SportId;
}

type MarkerKey = "kickoff" | "halfTime" | "fullTime" | "extraTime";
type FeedItem =
  | { kind: "event"; minute: number; ev: MatchEvent }
  | { kind: "marker"; minute: number; marker: MarkerKey };

interface SlotPlayer {
  pos: string;
  x: number;
  y: number;
  player?: Player;
}

const VISUAL: Record<MatchEventType, { emoji: string; ring: string }> = {
  goal: { emoji: "⚽", ring: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" },
  save: { emoji: "🧤", ring: "border-sky-300 bg-sky-50/60 dark:bg-sky-950/30" },
  miss: { emoji: "↗️", ring: "border-zinc-200 dark:border-zinc-800" },
  woodwork: { emoji: "🪵", ring: "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" },
  corner: { emoji: "🚩", ring: "border-zinc-200 dark:border-zinc-800" },
  freekick: { emoji: "🎯", ring: "border-zinc-200 dark:border-zinc-800" },
  foul: { emoji: "⚠️", ring: "border-zinc-200 dark:border-zinc-800" },
  offside: { emoji: "🚫", ring: "border-zinc-200 dark:border-zinc-800" },
  chance: { emoji: "✨", ring: "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20" },
  yellow: { emoji: "🟨", ring: "border-yellow-300 bg-yellow-50/60 dark:bg-yellow-950/20" },
  red: { emoji: "🟥", ring: "border-rose-400 bg-rose-50 dark:bg-rose-950/30" },
  injury: { emoji: "🚑", ring: "border-rose-300 bg-rose-50/50 dark:bg-rose-950/20" },
  substitution: { emoji: "🔁", ring: "border-zinc-200 dark:border-zinc-800" },
  penalty_shootout: { emoji: "🥅", ring: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" },
};

function evLabelKey(type: MatchEventType) {
  switch (type) {
    case "goal": return "evGoal";
    case "save": return "evSave";
    case "miss": return "evMiss";
    case "woodwork": return "evWoodwork";
    case "corner": return "evCorner";
    case "freekick": return "evFreekick";
    case "foul": return "evFoul";
    case "offside": return "evOffside";
    case "chance": return "evChance";
    case "yellow": return "yellowCard";
    case "red": return "redCard";
    case "injury": return "injury";
    case "substitution": return "evSub";
    default: return "goal";
  }
}

function shortName(p: Player): string {
  if (p.nameKo) return p.nameKo;
  const parts = p.name.split(" ");
  return parts[parts.length - 1];
}

export function MatchViewer({ result, home, away, players, sportId }: Props) {
  const { t, tl } = useI18n();
  const sport = getSport(sportId);

  // Resolve each club's XI onto its formation slots (for the formation tiles).
  const lineupSlots = (club: Club): SlotPlayer[] => {
    const formation = sport.formations.find((f) => f.key === club.tactics.formation) ?? sport.formations[0];
    let ids = club.tactics.lineup.filter((id) => players[id]);
    if (ids.length < formation.slots.length) ids = sport.autoPickLineup(club, players).lineup;
    return formation.slots.map((s, i) => ({ pos: s.position, x: s.x, y: s.y, player: players[ids[i]] }));
  };
  const homeSlots = useMemo(() => lineupSlots(home), [home, players, sport]); // eslint-disable-line react-hooks/exhaustive-deps
  const awaySlots = useMemo(() => lineupSlots(away), [away, players, sport]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasET = result.decidedBy === "extra_time" || result.decidedBy === "penalties";
  const endMinute = useMemo(
    () => Math.max(hasET ? 120 : 90, result.events.reduce((m, e) => Math.max(m, e.minute), 90)),
    [result.events, hasET],
  );

  const markers = useMemo<{ minute: number; marker: MarkerKey }[]>(() => {
    const list: { minute: number; marker: MarkerKey }[] = [
      { minute: 0, marker: "kickoff" },
      { minute: 45, marker: "halfTime" },
    ];
    if (hasET) list.push({ minute: 90, marker: "extraTime" });
    list.push({ minute: endMinute, marker: "fullTime" });
    return list;
  }, [hasET, endMinute]);

  const [clock, setClock] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showHalftime, setShowHalftime] = useState(false);

  const clockRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const htDoneRef = useRef(false);
  const htTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    lastRef.current = null;
    let raf = 0;
    const tick = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = now - lastRef.current;
      lastRef.current = now;
      let nc = clockRef.current + (dt / 1000) * MIN_PER_SEC * speed;

      if (!htDoneRef.current && clockRef.current < 45 && nc >= 45) {
        nc = 45;
        htDoneRef.current = true;
        clockRef.current = nc;
        setClock(nc);
        setPlaying(false);
        setShowHalftime(true);
        htTimerRef.current = window.setTimeout(() => {
          setShowHalftime(false);
          setPlaying(true);
        }, 2200);
        return;
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
  }, [playing, speed, endMinute]);

  useEffect(() => () => { if (htTimerRef.current) clearTimeout(htTimerRef.current); }, []);

  function clearHt() {
    if (htTimerRef.current) {
      clearTimeout(htTimerRef.current);
      htTimerRef.current = null;
    }
    setShowHalftime(false);
  }
  function togglePlay() {
    clearHt();
    if (clockRef.current >= endMinute) {
      clockRef.current = 0;
      htDoneRef.current = false;
      setClock(0);
      setPlaying(true);
    } else setPlaying((p) => !p);
  }
  function restart() {
    clearHt();
    clockRef.current = 0;
    htDoneRef.current = false;
    setClock(0);
    setPlaying(true);
  }
  function skip() {
    clearHt();
    clockRef.current = endMinute;
    htDoneRef.current = true;
    setClock(endMinute);
    setPlaying(false);
  }

  const finished = clock >= endMinute;
  const revealed = useMemo(() => result.events.filter((e) => e.minute <= clock), [result.events, clock]);
  const homeScore = revealed.filter((e) => e.type === "goal" && e.clubId === home.id).length;
  const awayScore = revealed.filter((e) => e.type === "goal" && e.clubId === away.id).length;
  const pens = revealed.find((e) => e.type === "penalty_shootout");

  // Live ratings converge from 6.6 toward the stored final rating as time passes.
  const ratingOf = (pid: string): number => {
    const final = result.playerRatings[pid] ?? 6.6;
    const prog = Math.min(1, clock / endMinute);
    return Math.round((6.6 + (final - 6.6) * prog) * 10) / 10;
  };

  // Live match stats derived from revealed events.
  const live = useMemo(() => {
    const z = { hShots: 0, aShots: 0, hOn: 0, aOn: 0, hCor: 0, aCor: 0, hFoul: 0, aFoul: 0 };
    for (const e of revealed) {
      const isHome = e.clubId === home.id;
      if (e.type === "goal") {
        if (isHome) { z.hShots++; z.hOn++; } else { z.aShots++; z.aOn++; }
      } else if (e.type === "miss" || e.type === "woodwork") {
        if (isHome) z.hShots++; else z.aShots++;
      } else if (e.type === "save") {
        // save belongs to the defending keeper; the shot came from the attacking end
        if (e.zone === "right") { z.hShots++; z.hOn++; } else { z.aShots++; z.aOn++; }
      } else if (e.type === "corner") {
        if (isHome) z.hCor++; else z.aCor++;
      } else if (e.type === "foul") {
        if (isHome) z.hFoul++; else z.aFoul++;
      }
    }
    return z;
  }, [revealed, home.id]);

  const lastPositional = [...revealed].reverse().find((e) => e.zone);
  const ballX = lastPositional?.zone === "left" ? 14 : lastPositional?.zone === "right" ? 86 : 50;
  const ballY = lastPositional
    ? lastPositional.type === "corner"
      ? lastPositional.minute % 2 === 0 ? 10 : 90
      : 30 + ((lastPositional.minute * 53) % 40)
    : 50;

  const newestGoal =
    revealed.length > 0 && revealed[revealed.length - 1].type === "goal" && clock - revealed[revealed.length - 1].minute < 3
      ? revealed[revealed.length - 1]
      : null;

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    for (const ev of result.events) if (ev.minute <= clock) items.push({ kind: "event", minute: ev.minute, ev });
    for (const m of markers) if (m.minute <= clock) items.push({ kind: "marker", minute: m.minute, marker: m.marker });
    items.sort((a, b) => b.minute - a.minute || (a.kind === "marker" ? 1 : -1));
    return items;
  }, [result.events, markers, clock]);

  const goalEvents = revealed.filter((e) => e.type === "goal" || e.type === "red" || e.type === "penalty_shootout");
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

  const shownMinute = Math.min(Math.floor(clock), endMinute);
  const clockLabel = showHalftime ? t("halfTime") : finished ? t("fullTime") : `${shownMinute}'`;

  return (
    <div className="flex flex-col gap-4">
      {/* Top control / scoreboard bar (FM-style) */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white/95 px-4 py-2.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden rounded-md border px-2 py-1 text-xs text-zinc-500 sm:inline">{t("tactics")}</span>
          <span className="rounded-md border px-2 py-1 text-xs capitalize text-zinc-500">{tl({ ko: "균형", en: "Balanced" })}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="max-w-[28vw] truncate text-right text-sm font-semibold">{home.shortName}</span>
          <span className={`rounded-md px-3 py-1 text-lg font-bold tabular-nums ${newestGoal ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"}`}>
            {homeScore} - {awayScore}
          </span>
          <span className="max-w-[28vw] truncate text-left text-sm font-semibold">{away.shortName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-sm text-zinc-500">
            {!finished && !showHalftime && <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" />}
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

      {/* Main grid: formations flank the pitch + stats */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
        <FormationTile title={`${home.shortName} · ${t("formation")}`} slots={homeSlots} attackUp ratingOf={ratingOf} t={t} />

        <div className="flex flex-col gap-4">
          {/* Pitch */}
          <Tile title={t("watchMatch")} action={<span className="font-mono text-xs text-zinc-400">{clockLabel}</span>}>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-emerald-900/30 bg-gradient-to-r from-green-600 to-green-700">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/40" />
              <div className="absolute left-1/2 top-1/2 h-[28%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
              <div className="absolute left-0 top-1/2 h-[55%] w-[12%] -translate-y-1/2 border border-l-0 border-white/40" />
              <div className="absolute right-0 top-1/2 h-[55%] w-[12%] -translate-y-1/2 border border-r-0 border-white/40" />
              <div className="absolute left-0 top-1/2 h-[20%] w-[2%] -translate-y-1/2 bg-white/30" />
              <div className="absolute right-0 top-1/2 h-[20%] w-[2%] -translate-y-1/2 bg-white/30" />
              <div
                className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md ring-2 ring-black/20 transition-all duration-500 ease-out"
                style={{ left: `${ballX}%`, top: `${ballY}%` }}
              />
              <div className="absolute left-2 top-2 rounded bg-black/30 px-2 py-0.5 text-xs font-medium text-white">{home.shortName}</div>
              <div className="absolute right-2 top-2 rounded bg-black/30 px-2 py-0.5 text-xs font-medium text-white">{away.shortName}</div>
              {newestGoal && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-bounce rounded-lg bg-black/55 px-6 py-3 text-3xl font-extrabold tracking-widest text-white">{t("evGoal")}!</div>
                </div>
              )}
            </div>
            {/* progress */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full bg-blue-500 transition-[width] duration-200" style={{ width: `${(clock / endMinute) * 100}%` }} />
            </div>
            {/* controls */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={togglePlay} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
                {playing ? `⏸ ${t("pause")}` : `▶ ${t("play")}`}
              </button>
              <button onClick={restart} className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">↺</button>
              <button onClick={skip} className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">⏭ {t("skipToEnd")}</button>
              <div className="ml-auto flex items-center gap-1">
                <span className="mr-1 text-xs text-zinc-500">{t("speed")}</span>
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

          {/* Stats + events */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Tile title={t("matchStats")}>
              <div className="flex flex-col gap-2">
                <StatRow label={t("shots")} h={live.hShots} a={live.aShots} />
                <StatRow label={t("shotsOnTarget")} h={live.hOn} a={live.aOn} />
                <StatRow label={t("evCorner")} h={live.hCor} a={live.aCor} />
                <StatRow label={t("evFoul")} h={live.hFoul} a={live.aFoul} />
                <StatRow label={t("possession")} h={result.stats.homePossession} a={100 - result.stats.homePossession} suffix="%" />
              </div>
            </Tile>
            <Tile title={t("matchEvents")}>
              <div className="flex max-h-44 flex-col gap-1 overflow-y-auto text-sm">
                {goalEvents.length === 0 && <p className="text-zinc-400">—</p>}
                {goalEvents.map((e, i) => {
                  const p = e.playerId ? players[e.playerId] : null;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-8 shrink-0 text-right font-mono text-xs text-zinc-500">{e.minute}&apos;</span>
                      <span>{VISUAL[e.type].emoji}</span>
                      <span className="truncate">{p ? playerDisplayName(p) : clubDisplayName(home.id === e.clubId ? home : away)}</span>
                    </div>
                  );
                })}
              </div>
            </Tile>
          </div>
        </div>

        <FormationTile title={`${away.shortName} · ${t("formation")}`} slots={awaySlots} attackUp={false} ratingOf={ratingOf} t={t} />
      </div>

      {/* Squad condition / rating bar (my club) */}
      <Tile title={`${clubDisplayName(home)} · ${t("squad")}`} bodyClassName="overflow-x-auto">
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

      {/* Commentary */}
      <Tile title={t("commentary")}>
        <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
          {feed.map((item, i) => {
            if (item.kind === "marker") {
              return (
                <div key={`m${i}`} className="my-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  {t(item.marker)}
                  <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </div>
              );
            }
            const ev = item.ev;
            const v = VISUAL[ev.type];
            const player = ev.playerId ? players[ev.playerId] : null;
            const assist = ev.assistId ? players[ev.assistId] : null;
            return (
              <div key={`e${i}`} className={`flex items-start gap-2 rounded-md border px-3 py-1.5 text-sm ${v.ring}`}>
                <span className="w-9 shrink-0 text-right font-mono text-xs text-zinc-500">{ev.minute}&apos;</span>
                <span className="shrink-0">{v.emoji}</span>
                <span className="flex-1">
                  <span className="font-semibold">{t(evLabelKey(ev.type) as Parameters<typeof t>[0])}</span>
                  {ev.detail ? <span className="text-zinc-600 dark:text-zinc-300"> · {tl(ev.detail)}</span> : null}
                  {player && <span className="ml-1 font-medium">— {playerDisplayName(player)}</span>}
                  {assist && <span className="text-xs text-zinc-500"> ({t("assist")}: {playerDisplayName(assist)})</span>}
                </span>
              </div>
            );
          })}
          {feed.length === 0 && <p className="text-sm text-zinc-400">{t("kickoff")}…</p>}
        </div>
      </Tile>

      {/* Half-time card (a "between highlights" screen, FM tiles/cards style) */}
      {showHalftime && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4" onClick={() => { clearHt(); setPlaying(true); }}>
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <Tile title={t("halfTime")} className="bg-white dark:bg-zinc-900">
              <div className="mb-3 text-center text-3xl font-bold tabular-nums">{homeScore} - {awayScore}</div>
              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
                <MiniStat label={t("shots")} v={`${live.hShots}-${live.aShots}`} />
                <MiniStat label={t("shotsOnTarget")} v={`${live.hOn}-${live.aOn}`} />
                <MiniStat label={t("possession")} v={`${result.stats.homePossession}%`} />
              </div>
              <h4 className="mb-1 text-xs font-semibold uppercase text-zinc-400">{t("ratings")}</h4>
              <div className="flex flex-col gap-1">
                {topPerformers.map(({ p, r }) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span>{playerDisplayName(p)}</span>
                    <span className={`rounded px-1.5 text-xs font-bold ${ratingColor(r)}`}>{r.toFixed(1)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { clearHt(); setPlaying(true); }} className="mt-4 w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                ▶ {t("play")}
              </button>
            </Tile>
          </div>
        </div>
      )}

      {/* Final ratings */}
      {finished && (
        <Tile title={t("ratings")}>
          <div className="grid gap-1 sm:grid-cols-2">
            {Object.entries(result.playerRatings)
              .sort((a, b) => b[1] - a[1])
              .map(([pid, rating]) => {
                const p = players[pid];
                if (!p) return null;
                return (
                  <div key={pid} className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-1.5 text-sm dark:border-zinc-800">
                    <span>{playerDisplayName(p)}</span>
                    <span className={`rounded px-1.5 font-bold tabular-nums ${ratingColor(rating)}`}>{rating.toFixed(1)}</span>
                  </div>
                );
              })}
          </div>
        </Tile>
      )}
    </div>
  );
}

function FormationTile({
  title,
  slots,
  attackUp,
  ratingOf,
  t,
}: {
  title: string;
  slots: SlotPlayer[];
  attackUp: boolean;
  ratingOf: (id: string) => number;
  t: (k: "condition") => string;
}) {
  return (
    <Tile title={title}>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gradient-to-b from-green-700 to-green-600">
        <div className="absolute left-0 top-1/2 h-px w-full bg-white/30" />
        <div className="absolute left-1/2 top-1/2 h-[14%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
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
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[9px] font-bold text-zinc-900 shadow ring-1 ring-black/20">
                {s.pos}
              </div>
              <span className="mt-0.5 max-w-[52px] truncate rounded bg-black/40 px-1 text-[9px] text-white">{shortName(p)}</span>
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
