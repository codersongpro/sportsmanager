"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { playerDisplayName } from "@/lib/utils/format";
import type { Tactics } from "@/lib/types";

const MENTALITY: Tactics["mentality"][] = ["defensive", "balanced", "attacking"];
const TEMPO: Tactics["tempo"][] = ["slow", "normal", "fast"];
const PRESSING: Tactics["pressing"][] = ["low", "medium", "high"];
const WIDTH: Tactics["width"][] = ["narrow", "normal", "wide"];

export default function TacticsPage() {
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);
  const setTactics = useGameStore((s) => s.setTactics);
  const setLineup = useGameStore((s) => s.setLineup);
  const autoPick = useGameStore((s) => s.autoPickLineup);

  if (!state) return null;
  const sport = getSport(state.sportId);
  const myClub = state.clubs[state.manager.clubId];
  const tactics = myClub.tactics;
  const formation = sport.formations.find((f) => f.key === tactics.formation) ?? sport.formations[0];
  const validation = sport.validateLineup(myClub, state.players);

  const squad = myClub.squad.map((id) => state.players[id]).filter(Boolean);
  const squadSorted = [...squad].sort((a, b) => sport.calcOverall(b) - sport.calcOverall(a));

  function setSlotPlayer(slotIndex: number, playerId: string) {
    const lineup = [...tactics.lineup];
    const bench = [...tactics.bench];
    const previous = lineup[slotIndex];

    const lineupIdx = lineup.indexOf(playerId);
    if (lineupIdx !== -1) {
      lineup[lineupIdx] = previous;
    } else {
      const benchIdx = bench.indexOf(playerId);
      if (benchIdx !== -1) bench[benchIdx] = previous;
      else if (previous) bench.push(previous);
    }
    lineup[slotIndex] = playerId;
    setLineup(lineup, bench.filter(Boolean));
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("tactics")}</h1>

      <div className="flex flex-wrap gap-3">
        <Field label={t("formation")}>
          <select
            value={tactics.formation}
            onChange={(e) => setTactics({ formation: e.target.value })}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {sport.formations.map((f) => (
              <option key={f.key} value={f.key}>
                {f.key}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("mentality")}>
          <select
            value={tactics.mentality}
            onChange={(e) => setTactics({ mentality: e.target.value as Tactics["mentality"] })}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {MENTALITY.map((m) => (
              <option key={m} value={m}>
                {t(m)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("tempo")}>
          <select
            value={tactics.tempo}
            onChange={(e) => setTactics({ tempo: e.target.value as Tactics["tempo"] })}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {TEMPO.map((m) => (
              <option key={m} value={m}>
                {t(m)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("pressing")}>
          <select
            value={tactics.pressing}
            onChange={(e) => setTactics({ pressing: e.target.value as Tactics["pressing"] })}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {PRESSING.map((m) => (
              <option key={m} value={m}>
                {t(m)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("width")}>
          <select
            value={tactics.width}
            onChange={(e) => setTactics({ width: e.target.value as Tactics["width"] })}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {WIDTH.map((m) => (
              <option key={m} value={m}>
                {t(m)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-zinc-500">{t("startingXI")}</h2>
        <button onClick={() => autoPick()} className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">
          {t("autoPick")}
        </button>
      </div>

      {!validation.valid && (
        <ul className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {validation.errors.map((e, i) => (
            <li key={i}>{e.ko}</li>
          ))}
        </ul>
      )}
      {validation.valid && <p className="text-sm text-emerald-600">{t("lineupValid")}</p>}

      <div className="grid gap-2 sm:grid-cols-2">
        {formation.slots.map((slot, i) => {
          const playerId = tactics.lineup[i];
          const player = playerId ? state.players[playerId] : undefined;
          return (
            <div key={i} className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
              <span className="w-10 shrink-0 font-mono text-xs text-zinc-500">{slot.position}</span>
              <select
                value={playerId ?? ""}
                onChange={(e) => setSlotPlayer(i, e.target.value)}
                className="flex-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
              >
                {playerId && !squadSorted.find((p) => p.id === playerId) && <option value={playerId}>{playerId}</option>}
                {squadSorted.map((p) => (
                  <option key={p.id} value={p.id}>
                    {playerDisplayName(p)} ({sport.calcOverall(p)})
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-zinc-500">{t("bench")}</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {tactics.bench.map((id) => {
            const p = state.players[id];
            if (!p) return null;
            return (
              <span key={id} className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-900">
                {playerDisplayName(p)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-500">
      {label}
      {children}
    </label>
  );
}
