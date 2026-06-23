"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { playerDisplayName } from "@/lib/utils/format";
import { Tile, conditionColor } from "@/components/Tile";
import type { Player, Tactics } from "@/lib/types";

const MENTALITY: Tactics["mentality"][] = ["defensive", "balanced", "attacking"];
const TEMPO: Tactics["tempo"][] = ["slow", "normal", "fast"];
const PRESSING: Tactics["pressing"][] = ["low", "medium", "high"];
const WIDTH: Tactics["width"][] = ["narrow", "normal", "wide"];

function ovrPill(ovr: number): string {
  if (ovr >= 80) return "bg-emerald-600 text-white";
  if (ovr >= 70) return "bg-lime-600 text-white";
  if (ovr >= 60) return "bg-amber-600/90 text-white";
  return "bg-zinc-500 text-white";
}

function shortName(p: Player): string {
  if (p.nameKo) return p.nameKo;
  const parts = p.name.split(" ");
  return parts[parts.length - 1];
}

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("tactics")}</h1>
        <div className="flex items-center gap-2">
          <select
            value={tactics.formation}
            onChange={(e) => setTactics({ formation: e.target.value })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900"
          >
            {sport.formations.map((f) => (
              <option key={f.key} value={f.key}>{f.key}</option>
            ))}
          </select>
          <button onClick={() => autoPick()} className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">
            {t("autoPick")}
          </button>
        </div>
      </div>

      {validation.valid ? (
        <p className="text-sm text-emerald-600">{t("lineupValid")}</p>
      ) : (
        <ul className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {validation.errors.map((e, i) => <li key={i}>{e.ko}</li>)}
        </ul>
      )}

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Instructions panel (left) */}
        <Tile title={t("mentality")}>
          <div className="flex flex-col gap-3">
            <Field label={t("mentality")}>
              <Select value={tactics.mentality} options={MENTALITY} onChange={(v) => setTactics({ mentality: v as Tactics["mentality"] })} t={t} />
            </Field>
            <Field label={t("tempo")}>
              <Select value={tactics.tempo} options={TEMPO} onChange={(v) => setTactics({ tempo: v as Tactics["tempo"] })} t={t} />
            </Field>
            <Field label={t("pressing")}>
              <Select value={tactics.pressing} options={PRESSING} onChange={(v) => setTactics({ pressing: v as Tactics["pressing"] })} t={t} />
            </Field>
            <Field label={t("width")}>
              <Select value={tactics.width} options={WIDTH} onChange={(v) => setTactics({ width: v as Tactics["width"] })} t={t} />
            </Field>
          </div>
        </Tile>

        {/* Pitch (center) */}
        <Tile title={`${t("startingXI")} · ${formation.key}`}>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-lg bg-gradient-to-b from-green-700 to-green-600">
            <div className="absolute left-0 top-1/2 h-px w-full bg-white/30" />
            <div className="absolute left-1/2 top-1/2 h-[14%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
            <div className="absolute left-1/2 bottom-0 h-[16%] w-[44%] -translate-x-1/2 border border-b-0 border-white/30" />
            {formation.slots.map((slot, i) => {
              const p = tactics.lineup[i] ? state.players[tactics.lineup[i]] : undefined;
              const top = 100 - slot.y;
              return (
                <div key={i} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${slot.x}%`, top: `${top}%` }}>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-bold text-zinc-900 shadow ring-1 ring-black/20">
                    {slot.position}
                  </div>
                  {p ? (
                    <>
                      <span className="mt-0.5 max-w-[60px] truncate rounded bg-black/40 px-1 text-[10px] text-white" title={playerDisplayName(p)}>
                        {shortName(p)}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`rounded px-1 text-[9px] font-bold ${ovrPill(sport.calcOverall(p))}`}>{sport.calcOverall(p)}</span>
                        <span className={`text-[9px] ${conditionColor(p.condition)}`}>♥{Math.round(p.condition)}</span>
                      </div>
                    </>
                  ) : (
                    <span className="mt-0.5 text-[10px] text-white/70">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </Tile>
      </div>

      {/* Starting XI editor */}
      <Tile title={t("startingXI")}>
        <div className="grid gap-2 sm:grid-cols-2">
          {formation.slots.map((slot, i) => {
            const playerId = tactics.lineup[i];
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
      </Tile>

      {/* Bench */}
      <Tile title={t("bench")}>
        <div className="flex flex-wrap gap-2 text-sm">
          {tactics.bench.length === 0 && <span className="text-zinc-400">—</span>}
          {tactics.bench.map((id) => {
            const p = state.players[id];
            if (!p) return null;
            return (
              <span key={id} className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-900" title={playerDisplayName(p)}>
                {shortName(p)} <span className={`text-xs font-bold ${conditionColor(p.condition)}`}>♥{Math.round(p.condition)}</span>
              </span>
            );
          })}
        </div>
      </Tile>
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

function Select({
  value,
  options,
  onChange,
  t,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  t: (k: never) => string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {t(o as never)}
        </option>
      ))}
    </select>
  );
}
