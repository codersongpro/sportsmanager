"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MatchSegmentKind, Tactics } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { deriveMatchAdvice } from "@/lib/engine/matchAdvice";
import { TACTIC_PRESETS } from "@/lib/data/tacticPresets";
import { TEAM_TALK_OPTIONS } from "@/lib/data/teamTalks";
import { buildLiveVenue, lineupSlots, liveRallyScore, momentumBuckets } from "@/lib/sports/playback";
import { BroadcastFeed, MatchViewer, MomentumBar, StatRow, toneAccent, type FeedItem } from "@/components/MatchViewer";
import { Venue } from "@/components/Venue";
import { Avatar, Tile } from "@/components/Tile";
import { Button } from "@/components/ui";
import { clubDisplayName } from "@/lib/utils/format";

const MENTALITY: Tactics["mentality"][] = ["defensive", "balanced", "attacking"];
const TEMPO: Tactics["tempo"][] = ["slow", "normal", "fast"];
const PRESSING: Tactics["pressing"][] = ["low", "medium", "high"];
const WIDTH: Tactics["width"][] = ["narrow", "normal", "wide"];

export default function MatchLivePage() {
  const { t, tl } = useI18n();
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const playNextSegment = useGameStore((s) => s.playNextSegment);
  const continueGame = useGameStore((s) => s.continue);
  const makeSubstitution = useGameStore((s) => s.makeSubstitution);
  const giveTeamTalk = useGameStore((s) => s.giveTeamTalk);
  const setTactics = useGameStore((s) => s.setTactics);

  const active = state?.activeMatch;
  // Derived (not frozen) so that clicking "next match" naturally reveals
  // whichever fixture `continue()` lands on, without a manual route change.
  const fixtureId = active?.fixtureId ?? state?.lastResultFixtureId ?? null;
  const phaseRef = useRef<MatchSegmentKind | null>(null);
  const [tacticChanges, setTacticChanges] = useState(0);
  const [subOutId, setSubOutId] = useState("");
  const [subError, setSubError] = useState<string | null>(null);

  // Progressive broadcast reveal: a played segment lands as a whole batch of
  // events, but they should tick onto the feed one at a time like a live
  // broadcast. `revealCount` walks up to however many events have been played,
  // pausing when it catches up and resuming when the next segment is played.
  const totalEventCount = active ? active.segments.reduce((n, s) => n + s.result.events.length, 0) : 0;
  const [revealCount, setRevealCount] = useState(0);
  // Lets the user freeze the broadcast at any moment — e.g. to study the pitch and
  // queue up a substitution or tactic change — without the feed racing ahead.
  const [paused, setPaused] = useState(false);

  // Restart the reveal whenever the match itself changes (a new fixture begins),
  // so the next match doesn't inherit the previous one's already-revealed count.
  // Adjusting state during render (the React-sanctioned pattern) avoids the
  // cascading-render warning a reset effect would trigger.
  const lastFixtureRef = useRef<string | null | undefined>(active?.fixtureId);
  if (active?.fixtureId !== lastFixtureRef.current) {
    lastFixtureRef.current = active?.fixtureId;
    if (revealCount !== 0) setRevealCount(0);
    if (paused) setPaused(false);
  }

  useEffect(() => {
    if (paused || revealCount >= totalEventCount) return;
    const pending = totalEventCount - revealCount;
    // Reveal faster when a burst is queued, slower for the occasional lone event,
    // so a busy quarter doesn't drag while a quiet half still feels live. Paced at
    // roughly half the original speed so the broadcast is easier to follow.
    const delay = Math.max(360, Math.min(1500, 7000 / pending));
    const id = window.setTimeout(() => setRevealCount((c) => Math.min(totalEventCount, c + 1)), delay);
    return () => clearTimeout(id);
  }, [paused, revealCount, totalEventCount]);

  useEffect(() => {
    if (active && active.phase !== phaseRef.current) {
      phaseRef.current = active.phase;
      setSubOutId("");
      setSubError(null);
    }
  }, [active?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return null;

  const sport = getSport(state.sportId);
  const pres = sport.matchPresentation;
  // Use whichever competition/club registry the active (or just-finished) match belongs to:
  // the World Cup keeps nations in a separate registry, Club Cup entrants are domestic clubs.
  const scope = state.activeMatch?.scope ?? state.lastResultScope ?? "domestic";
  const clubsMap = scope === "worldcup" ? state.worldCup?.clubs ?? state.clubs : state.clubs;
  const myClubId = scope === "worldcup" ? state.worldCup?.userNationId ?? state.manager.clubId : state.manager.clubId;
  const myClub = clubsMap[myClubId];
  const fixtures = scope === "worldcup"
    ? state.worldCup?.competition.fixtures ?? []
    : scope === "clubcup"
      ? state.clubCup?.competition.fixtures ?? []
      : state.competition.fixtures;
  const fixture = fixtures.find((f) => f.id === fixtureId);

  function bumpTactics(patch: Parameters<typeof setTactics>[0]) {
    setTactics(patch);
    setTacticChanges((n) => n + 1);
  }

  function handleContinueToNext() {
    continueGame();
    if (useGameStore.getState().state?.seasonOver) router.push("/game/dashboard");
  }

  // Click-to-substitute: pick the player coming off (pitch marker or chip), then
  // click the replacement to make the change instantly — no dropdowns or confirm.
  function selectSubOut(outId: string) {
    setSubError(null);
    setSubOutId((cur) => (cur === outId ? "" : outId));
  }
  function bringOn(inId: string) {
    if (!active) return;
    if (!subOutId) {
      setSubError(tl({ ko: "먼저 교체할 선수를 선택하세요", en: "Pick a player to take off first" }));
      return;
    }
    const res = makeSubstitution(subOutId, inId);
    if (res.ok) {
      setSubOutId("");
      setSubError(null);
    } else {
      setSubError(tl(res.message));
    }
  }

  if (active) {
    const home = clubsMap[active.homeId];
    const away = clubsMap[active.awayId];
    // Only the events revealed so far drive the feed, scoreboard, stats and pitch,
    // so a played segment streams in one at a time instead of appearing at once.
    const playedEvents = active.segments.flatMap((s) => s.result.events).sort((a, b) => a.minute - b.minute);
    const knownEvents = playedEvents.slice(0, Math.min(revealCount, playedEvents.length));
    // The segment currently being broadcast (which the reveal has reached) — not
    // `active.phase`, which is the *next* segment to play, so the header doesn't
    // read "second half" while the first half is still streaming in.
    let broadcastPhase = active.segments[0]?.kind ?? active.phase;
    let revealedSoFar = 0;
    for (const seg of active.segments) {
      broadcastPhase = seg.kind;
      revealedSoFar += seg.result.events.length;
      if (revealCount <= revealedSoFar) break;
    }
    const shownHomeScore = pres.scoreOf(knownEvents, home.id);
    const shownAwayScore = pres.scoreOf(knownEvents, away.id);
    const totalSpan = Math.max(pres.endProgress, ...knownEvents.map((e) => e.minute), 1);
    const clock = knownEvents.length ? Math.max(...knownEvents.map((e) => e.minute)) : 0;
    const liveStats = pres.liveStats(knownEvents, home.id, away.id);
    const momentum = momentumBuckets(knownEvents, clock, totalSpan, home.id, away.id, pres);
    const feed: FeedItem[] = [];
    feed.push({ kind: "marker", minute: 0, label: pres.openLabel });
    for (const b of pres.breaks) if (b.at <= clock) feed.push({ kind: "marker", minute: b.at, label: b.label });
    for (const ev of knownEvents) feed.push({ kind: "event", minute: ev.minute, ev });
    feed.sort((a, b) => b.minute - a.minute || (a.kind === "marker" ? 1 : -1));
    const latestEventItem = feed.find((item) => item.kind === "event") as Extract<FeedItem, { kind: "event" }> | undefined;
    const latestMeta = latestEventItem ? pres.eventMeta(latestEventItem.ev.type) : null;

    const homeSlots = lineupSlots(sport, home, state.players);
    const awaySlots = lineupSlots(sport, away, state.players);
    const { homeMarkers, awayMarkers, ballX, ballY } = buildLiveVenue(pres, knownEvents, homeSlots, awaySlots, state.players, home.id, away.id, clock);
    const liveRally = liveRallyScore(knownEvents);

    const subOutOptions = myClub.tactics.lineup.filter((id) => state.players[id] && !active.subbedOffIds.includes(id));
    const subInOptions = myClub.tactics.bench.filter((id) => state.players[id] && !active.subbedOffIds.includes(id));
    const maxSubs = pres.maxSubs ?? 5;
    const subsLeft = active.subsMade < maxSubs;
    // Team talk resets each segment (see advanceActiveMatch), so it can be given
    // and changed at every break, not just once at halftime.
    const canTeamTalk = !active.teamTalkGiven;
    const tips = deriveMatchAdvice(active, myClub.id);
    // The user's own side on the pitch — its markers are clickable to pick a sub.
    const userIsHome = home.id === myClub.id;
    const pitchSubClick = subsLeft ? selectSubOut : undefined;

    return (
      <div className="flex flex-col gap-3 p-2 sm:p-3 lg:h-full lg:min-h-0 lg:overflow-hidden">
        <div
          className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-3.5"
          style={{ borderColor: "var(--line)", background: "linear-gradient(120deg,#10243a,#0d1727)" }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar initials={home.shortName.slice(0, 2).toUpperCase()} color="var(--blue)" size={40} rounded="11px" />
            <span className="truncate text-[13px] font-semibold">{home.shortName}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-3">
            <span className="flex items-center gap-[7px] text-[11px] font-bold" style={{ color: "var(--red)" }}>
              <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full" style={{ background: "var(--red)" }} />
              {tl(pres.segmentLabel(broadcastPhase))}
            </span>
            <span
              key={`${shownHomeScore}-${shownAwayScore}`}
              className={`font-display text-[36px] font-bold leading-none tabular-nums ${shownHomeScore + shownAwayScore > 0 ? "score-flash" : ""}`}
            >
              {shownHomeScore} <span style={{ color: "var(--muted-3)" }}>:</span> {shownAwayScore}
            </span>
            {liveRally && (
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--muted-3)" }}>
                {liveRally.home}-{liveRally.away}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <span className="truncate text-right text-[13px] font-semibold">{away.shortName}</span>
            <Avatar initials={away.shortName.slice(0, 2).toUpperCase()} color="var(--red)" size={40} rounded="11px" />
          </div>
        </div>

        {latestEventItem && latestMeta && (
          <div
            className="flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] lg:hidden"
            style={{ borderColor: "var(--line)", background: "var(--panel)" }}
          >
            <span className="shrink-0">{latestMeta.emoji}</span>
            <span className="font-display shrink-0 font-bold tabular-nums" style={{ color: toneAccent(latestMeta.tone) }}>
              {pres.clockLabel(latestEventItem.ev.minute, totalSpan, false)}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">{tl(latestMeta.label)}</span>
          </div>
        )}

        <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.62fr)_minmax(300px,0.68fr)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden">
          <Button onClick={() => playNextSegment()} className="order-first w-full shrink-0 lg:hidden">
            {t("continueMatchBtn")}
          </Button>

          <div className="order-2 flex flex-col gap-3 lg:order-none lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <Tile
              title={t("watchMatch")}
              action={
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-soft">{tl(pres.segmentLabel(broadcastPhase))}</span>
                  {revealCount < totalEventCount && (
                    <button
                      onClick={() => setPaused((p) => !p)}
                      className="rounded-md border px-2 py-1 text-[11px] font-semibold"
                      style={{ borderColor: "var(--border-soft)", color: "var(--muted-2)", background: "var(--panel-2)" }}
                    >
                      {paused ? `▶ ${t("play")}` : `⏸ ${t("pause")}`}
                    </button>
                  )}
                </div>
              }
              className="shrink-0"
            >
              <Venue
                venue={pres.venue}
                ballX={ballX}
                ballY={ballY}
                homeShort={home.shortName}
                awayShort={away.shortName}
                flash={null}
                homeMarkers={homeMarkers}
                awayMarkers={awayMarkers}
                homeMarkerClick={userIsHome ? pitchSubClick : undefined}
                awayMarkerClick={userIsHome ? undefined : pitchSubClick}
                selectedMarkerId={subOutId}
              />
            </Tile>
            <MomentumBar buckets={momentum} homeShort={home.shortName} awayShort={away.shortName} title={t("momentum")} />
            <Tile title={t("matchStats")}>
              <div className="flex flex-col gap-2">
                {liveStats.map((row, i) => (
                  <StatRow key={i} label={tl(row.label)} h={row.h} a={row.a} suffix={row.suffix} />
                ))}
                {liveStats.length === 0 && <p className="text-sm" style={{ color: "var(--muted-3)" }}>—</p>}
              </div>
            </Tile>
          </div>

          <div className="order-1 lg:order-none lg:min-h-0 lg:overflow-hidden">
            <BroadcastFeed title={t("matchEvents")} feed={feed} players={state.players} home={home} away={away} pres={pres} endMinute={totalSpan} tl={tl} t={t} />
          </div>

          <div className="order-3 flex flex-col gap-3 lg:order-none lg:min-h-0 lg:overflow-hidden">
          <div className="flex flex-col gap-3 pr-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <Tile title={t("tacticalAdvice")}>
              {tips.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--muted-3)" }}>{t("noAdvice")}</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm" style={{ color: "var(--muted-2)" }}>
                  {tips.map((tip) => (
                    <li key={tip.key}>{tl(tip.text)}</li>
                  ))}
                </ul>
              )}
            </Tile>

            <Tile title={t("substitutionsTitle")} subtitle={`${t("subsUsed")}: ${active.subsMade} / ${maxSubs}`}>
              {!subsLeft ? (
                <p className="text-sm" style={{ color: "var(--muted-3)" }}>{t("noSubsRemaining")}</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>{t("subOutLabel")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {subOutOptions.map((id) => {
                        const sel = subOutId === id;
                        return (
                          <button
                            key={id}
                            onClick={() => selectSubOut(id)}
                            className="rounded-lg border px-2 py-1 text-xs font-semibold"
                            style={{
                              borderColor: sel ? "var(--mint)" : "var(--border-soft)",
                              background: sel ? "var(--mint)" : "var(--panel-2)",
                              color: sel ? "#06140e" : "var(--text)",
                            }}
                          >
                            {state.players[id].nameKo ?? state.players[id].name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>{t("subInLabel")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {subInOptions.length === 0 && <p className="text-xs" style={{ color: "var(--muted-3)" }}>—</p>}
                      {subInOptions.map((id) => (
                        <button
                          key={id}
                          onClick={() => bringOn(id)}
                          disabled={!subOutId}
                          className="rounded-lg border px-2 py-1 text-xs font-semibold disabled:opacity-40"
                          style={{ borderColor: "var(--border-soft)", background: "var(--panel-2)", color: "var(--text)" }}
                        >
                          {state.players[id].nameKo ?? state.players[id].name}
                        </button>
                      ))}
                    </div>
                  </div>
                  {subError && <p className="text-xs" style={{ color: "var(--red)" }}>{subError}</p>}
                </div>
              )}
            </Tile>

            <Tile title={t("teamTalk")}>
              {active.teamTalkGiven ? (
                <p className="text-sm" style={{ color: "var(--muted-3)" }}>{t("teamTalkGivenNote")}</p>
              ) : !canTeamTalk ? (
                <p className="text-sm" style={{ color: "var(--muted-3)" }}>{t("teamTalkHalftimeOnly")}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {TEAM_TALK_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => giveTeamTalk(opt.key)}
                      className="rounded-lg border px-3 py-2 text-left text-sm"
                      style={{ borderColor: "var(--border-soft)", background: "var(--panel-2)" }}
                    >
                      <div className="font-semibold">{tl(opt.label)}</div>
                      <div className="mt-0.5 text-xs" style={{ color: "var(--muted-3)" }}>{tl(opt.description)}</div>
                    </button>
                  ))}
                </div>
              )}
            </Tile>

            <Tile title={t("teamInstructions")}>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-1.5">
                  {TACTIC_PRESETS.map((preset) => (
                    <button
                      key={preset.name.en}
                      onClick={() => bumpTactics(preset.patch)}
                      className="rounded-lg px-2 py-1.5 text-xs font-semibold"
                      style={{ color: "var(--muted-2)", background: "rgba(255,255,255,.05)" }}
                    >
                      {tl(preset.name)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 border-t pt-2.5" style={{ borderColor: "var(--line)" }}>
                  <InstrField label={t("mentality")} value={myClub.tactics.mentality} options={MENTALITY} onChange={(v) => bumpTactics({ mentality: v as Tactics["mentality"] })} t={t} />
                  <InstrField label={t("tempo")} value={myClub.tactics.tempo} options={TEMPO} onChange={(v) => bumpTactics({ tempo: v as Tactics["tempo"] })} t={t} />
                  <InstrField label={t("pressing")} value={myClub.tactics.pressing} options={PRESSING} onChange={(v) => bumpTactics({ pressing: v as Tactics["pressing"] })} t={t} />
                  <InstrField label={t("width")} value={myClub.tactics.width} options={WIDTH} onChange={(v) => bumpTactics({ width: v as Tactics["width"] })} t={t} />
                </div>
              </div>
            </Tile>

            <Tile title={t("decisionRecap")}>
              <div className="flex flex-col gap-1.5 text-sm" style={{ color: "var(--muted-2)" }}>
                <div className="flex justify-between"><span>{t("subsUsed")}</span><span className="font-semibold">{active.subsMade} / {maxSubs}</span></div>
                <div className="flex justify-between"><span>{t("teamTalk")}</span><span className="font-semibold">{active.teamTalkGiven ? "✓" : "—"}</span></div>
                <div className="flex justify-between"><span>{t("tacticChangesCount")}</span><span className="font-semibold">{tacticChanges}</span></div>
              </div>
            </Tile>

          </div>
            <div className="hidden lg:block">
              <Button onClick={() => playNextSegment()} className="w-full shrink-0">
                {t("continueMatchBtn")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fixture?.result && fixture.played) {
    const home = clubsMap[fixture.result.homeId];
    const away = clubsMap[fixture.result.awayId];
    return (
      <div className="flex w-full flex-col gap-2 p-2 sm:p-3 lg:h-full lg:overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h1 className="font-display text-lg font-bold">{clubDisplayName(home)} vs {clubDisplayName(away)}</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/game/dashboard"
              className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
              style={{ borderColor: "var(--border-soft)", color: "var(--muted-2)" }}
            >
              {t("backToDashboard")}
            </Link>
            {scope === "domestic" && (
              <Button onClick={handleContinueToNext} className="px-3 py-1.5 text-sm">
                {t("continueToNextMatchBtn")}
              </Button>
            )}
          </div>
        </div>
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <MatchViewer result={fixture.result} home={home} away={away} players={state.players} sportId={state.sportId} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        <p className="mb-4 text-sm" style={{ color: "var(--muted-3)" }}>{t("noMatchInProgress")}</p>
        <Link
          href="/game/dashboard"
          className="rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ color: "#06140e", background: "var(--mint)" }}
        >
          {t("backToDashboard")}
        </Link>
      </div>
    </div>
  );
}

/** Compact label + dropdown for one team instruction (mentality/tempo/pressing/width). */
function InstrField({
  label,
  value,
  options,
  onChange,
  t,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  t: (k: never) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[12px]" style={{ color: "var(--muted-2)" }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-display rounded-md bg-transparent px-1 py-0.5 text-right text-[12.5px] font-bold outline-none"
        style={{ color: "var(--mint)" }}
      >
        {options.map((o) => (
          <option key={o} value={o} className="text-black">
            {t(o as never)}
          </option>
        ))}
      </select>
    </div>
  );
}
