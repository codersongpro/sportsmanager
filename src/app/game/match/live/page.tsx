"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MatchSegmentKind } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { deriveMatchAdvice } from "@/lib/engine/matchAdvice";
import { TACTIC_PRESETS } from "@/lib/data/tacticPresets";
import { TEAM_TALK_OPTIONS } from "@/lib/data/teamTalks";
import { momentumBuckets } from "@/lib/sports/playback";
import { BroadcastFeed, MatchViewer, MomentumBar, StatRow, type FeedItem } from "@/components/MatchViewer";
import { LineupBoard } from "@/components/LineupBoard";
import { Avatar, Tile } from "@/components/Tile";
import { Button } from "@/components/ui";
import { clubDisplayName } from "@/lib/utils/format";

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
  const [subInId, setSubInId] = useState("");
  const [subError, setSubError] = useState<string | null>(null);

  useEffect(() => {
    if (active && active.phase !== phaseRef.current) {
      phaseRef.current = active.phase;
      setSubOutId("");
      setSubInId("");
      setSubError(null);
    }
  }, [active?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return null;

  const sport = getSport(state.sportId);
  const pres = sport.matchPresentation;
  const myClub = state.clubs[state.manager.clubId];
  const fixture = state.competition.fixtures.find((f) => f.id === fixtureId);

  function bumpTactics(patch: Parameters<typeof setTactics>[0]) {
    setTactics(patch);
    setTacticChanges((n) => n + 1);
  }

  function handleContinueToNext() {
    continueGame();
    if (useGameStore.getState().state?.seasonOver) router.push("/game/dashboard");
  }

  function handleSub() {
    if (!active || !subOutId || !subInId) return;
    const res = makeSubstitution(subOutId, subInId);
    if (res.ok) {
      setSubOutId("");
      setSubInId("");
      setSubError(null);
    } else {
      setSubError(tl(res.message));
    }
  }

  if (active) {
    const home = state.clubs[active.homeId];
    const away = state.clubs[active.awayId];
    const knownEvents = active.segments.flatMap((s) => s.result.events).sort((a, b) => a.minute - b.minute);
    const totalSpan = Math.max(pres.endProgress, ...knownEvents.map((e) => e.minute), 1);
    const clock = knownEvents.length ? Math.max(...knownEvents.map((e) => e.minute)) : 0;
    const liveStats = pres.liveStats(knownEvents, home.id, away.id);
    const momentum = momentumBuckets(knownEvents, clock, totalSpan, home.id, away.id, pres);
    const feed: FeedItem[] = [];
    feed.push({ kind: "marker", minute: 0, label: pres.openLabel });
    for (const b of pres.breaks) if (b.at <= clock) feed.push({ kind: "marker", minute: b.at, label: b.label });
    for (const ev of knownEvents) feed.push({ kind: "event", minute: ev.minute, ev });
    feed.sort((a, b) => b.minute - a.minute || (a.kind === "marker" ? 1 : -1));

    const subOutOptions = myClub.tactics.lineup.filter((id) => state.players[id] && !active.subbedOffIds.includes(id));
    const subInOptions = myClub.tactics.bench.filter((id) => state.players[id] && !active.subbedOffIds.includes(id));
    const maxSubs = pres.maxSubs ?? 5;
    const isFirstSegment = active.phase === (sport.firstSegment?.(active.opts) ?? "first_half");
    const canTeamTalk = !isFirstSegment && !active.teamTalkGiven;
    const tips = deriveMatchAdvice(active, myClub.id);

    return (
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-2 sm:p-3">
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
              {tl(pres.segmentLabel(active.phase))}
            </span>
            <span className="font-display text-[36px] font-bold leading-none tabular-nums">
              {active.homeScore} <span style={{ color: "var(--muted-3)" }}>:</span> {active.awayScore}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <span className="truncate text-right text-[13px] font-semibold">{away.shortName}</span>
            <Avatar initials={away.shortName.slice(0, 2).toUpperCase()} color="var(--red)" size={40} rounded="11px" />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)]">
          <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <Tile title={`${myClub.shortName} · ${t("formation")}`} className="shrink-0">
              <LineupBoard sport={sport} tactics={myClub.tactics} players={state.players} maxHeight={220} />
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
            <div className="min-h-0 flex-1 overflow-hidden">
              <BroadcastFeed title={t("matchEvents")} feed={feed} players={state.players} home={home} away={away} pres={pres} endMinute={totalSpan} tl={tl} t={t} />
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
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
              {active.subsMade >= maxSubs ? (
                <p className="text-sm" style={{ color: "var(--muted-3)" }}>{t("noSubsRemaining")}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <select
                    value={subOutId}
                    onChange={(e) => setSubOutId(e.target.value)}
                    className="rounded-md border px-2 py-1.5 text-sm"
                    style={{ borderColor: "var(--border-soft)", background: "var(--panel-2)", color: "var(--text)" }}
                  >
                    <option value="">{t("subOutLabel")} — {t("selectPlayer")}</option>
                    {subOutOptions.map((id) => (
                      <option key={id} value={id}>{state.players[id].nameKo ?? state.players[id].name}</option>
                    ))}
                  </select>
                  <select
                    value={subInId}
                    onChange={(e) => setSubInId(e.target.value)}
                    className="rounded-md border px-2 py-1.5 text-sm"
                    style={{ borderColor: "var(--border-soft)", background: "var(--panel-2)", color: "var(--text)" }}
                  >
                    <option value="">{t("subInLabel")} — {t("selectPlayer")}</option>
                    {subInOptions.map((id) => (
                      <option key={id} value={id}>{state.players[id].nameKo ?? state.players[id].name}</option>
                    ))}
                  </select>
                  <Button variant="secondary" disabled={!subOutId || !subInId} onClick={handleSub}>
                    {t("confirmSubBtn")}
                  </Button>
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
            </Tile>

            <Tile title={t("decisionRecap")}>
              <div className="flex flex-col gap-1.5 text-sm" style={{ color: "var(--muted-2)" }}>
                <div className="flex justify-between"><span>{t("subsUsed")}</span><span className="font-semibold">{active.subsMade} / {maxSubs}</span></div>
                <div className="flex justify-between"><span>{t("teamTalk")}</span><span className="font-semibold">{active.teamTalkGiven ? "✓" : "—"}</span></div>
                <div className="flex justify-between"><span>{t("tacticChangesCount")}</span><span className="font-semibold">{tacticChanges}</span></div>
              </div>
            </Tile>

          </div>
            <Button onClick={() => playNextSegment()} className="w-full shrink-0">
              {t("continueMatchBtn")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (fixture?.result && fixture.played) {
    const home = state.clubs[fixture.result.homeId];
    const away = state.clubs[fixture.result.awayId];
    return (
      <div className="flex h-full w-full flex-col gap-2 overflow-hidden p-2 sm:p-3">
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
            <Button onClick={handleContinueToNext} className="px-3 py-1.5 text-sm">
              {t("continueToNextMatchBtn")}
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
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
