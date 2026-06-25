"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { playerDisplayName, playerInitials } from "@/lib/utils/format";
import { Avatar, RatingNumber, StatBar, Tile, attributeTierColor, conditionColor, groupColor, overallColor } from "@/components/Tile";
import { VenueSurfaceVertical, venueAspectVertical, venueBgStyle } from "@/components/Venue";
import { TACTIC_PRESETS } from "@/lib/data/tacticPresets";
import type { Player, SportModule, Tactics } from "@/lib/types";

const MENTALITY: Tactics["mentality"][] = ["defensive", "balanced", "attacking"];
const TEMPO: Tactics["tempo"][] = ["slow", "normal", "fast"];
const PRESSING: Tactics["pressing"][] = ["low", "medium", "high"];
const WIDTH: Tactics["width"][] = ["narrow", "normal", "wide"];
const ACCENTS = ["var(--mint)", "var(--blue)", "var(--gold)", "var(--purple)"];

function shortName(p: Player): string {
  if (p.nameKo) return p.nameKo;
  const parts = p.name.split(" ");
  return parts[parts.length - 1];
}

export default function TacticsPage() {
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);
  const setTactics = useGameStore((s) => s.setTactics);
  const setLineup = useGameStore((s) => s.setLineup);
  const autoPick = useGameStore((s) => s.autoPickLineup);
  const [hovered, setHovered] = useState<number | null>(null);

  if (!state) return null;
  const sport = getSport(state.sportId);
  const pres = sport.matchPresentation;
  const myClub = state.clubs[state.manager.clubId];
  const tactics = myClub.tactics;
  const formation = sport.formations.find((f) => f.key === tactics.formation) ?? sport.formations[0];
  const tags = sport.tacticTags?.(tactics) ?? [];
  const validation = sport.validateLineup(myClub, state.players);
  const filled = tactics.lineup.filter((id) => id && state.players[id]).length;
  const required = formation.slots.length;

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-[18px]">
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_320px]">
        {/* formation + pitch */}
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <div className="font-display text-base font-bold">{t("formation")}</div>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {sport.formations.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTactics({ formation: f.key })}
                  className="font-display rounded-lg px-3 py-[5px] text-xs font-bold"
                  style={f.key === tactics.formation ? { color: "#06140e", background: "var(--mint)" } : { color: "var(--muted-2)", background: "rgba(255,255,255,.05)" }}
                >
                  {f.key}
                </button>
              ))}
              <button onClick={() => autoPick()} className="rounded-lg px-3 py-[5px] text-xs font-semibold" style={{ color: "var(--muted-2)", background: "rgba(255,255,255,.05)" }}>
                {t("autoPick")}
              </button>
            </div>
          </div>

          <div
            className="relative mx-auto overflow-hidden rounded-[14px] border"
            style={{ aspectRatio: venueAspectVertical(pres.venue), maxHeight: 560, borderColor: "rgba(255,255,255,.08)", ...venueBgStyle(pres.venue) }}
          >
            <VenueSurfaceVertical venue={pres.venue} />
            {formation.slots.map((slot, i) => {
              const p = tactics.lineup[i] ? state.players[tactics.lineup[i]] : undefined;
              const group = sport.positions.find((meta) => meta.key === slot.position)?.group ?? "";
              const color = groupColor(group);
              const top = 100 - slot.y;
              return (
                <div
                  key={i}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                  style={{ left: `${slot.x}%`, top: `${top}%`, zIndex: hovered === i ? 30 : 1 }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                >
                  <div
                    className="font-display flex h-10 w-10 cursor-default items-center justify-center rounded-full border-[2.5px] text-[15px] font-bold"
                    style={{ background: "#0E121B", borderColor: color, color: "#EAEEF5", boxShadow: "0 4px 12px rgba(0,0,0,.4)" }}
                  >
                    {p ? playerInitials(p) : slot.position}
                  </div>
                  <span className="whitespace-nowrap rounded px-1.5 py-px text-[10px] font-semibold" style={{ color: "#EAEEF5", background: "rgba(0,0,0,.55)" }}>
                    {p ? shortName(p) : "—"}
                  </span>
                  <span className="text-[8.5px] font-bold tracking-wide" style={{ color }}>{slot.position}</span>

                  {p && hovered === i && (
                    <div
                      className="absolute bottom-full z-30 mb-2 w-56 rounded-xl border p-3 text-left shadow-2xl"
                      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <PlayerHoverCard player={p} sport={sport} t={t} tl={tl} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* team instructions + lineup validity */}
        <div className="flex flex-col gap-[18px]">
          <Tile title={t("teamInstructions")}>
            <div className="mb-3.5 grid grid-cols-2 gap-2">
              {TACTIC_PRESETS.map((preset) => (
                <button
                  key={preset.name.en}
                  onClick={() => setTactics(preset.patch)}
                  className="rounded-lg px-2 py-1.5 text-xs font-semibold"
                  style={{ color: "var(--muted-2)", background: "rgba(255,255,255,.05)" }}
                >
                  {tl(preset.name)}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <InstrField label={t("mentality")} value={tactics.mentality} options={MENTALITY} onChange={(v) => setTactics({ mentality: v as Tactics["mentality"] })} t={t} color={ACCENTS[0]} />
              <InstrField label={t("tempo")} value={tactics.tempo} options={TEMPO} onChange={(v) => setTactics({ tempo: v as Tactics["tempo"] })} t={t} color={ACCENTS[1]} />
              <InstrField label={t("pressing")} value={tactics.pressing} options={PRESSING} onChange={(v) => setTactics({ pressing: v as Tactics["pressing"] })} t={t} color={ACCENTS[2]} />
              <InstrField label={t("width")} value={tactics.width} options={WIDTH} onChange={(v) => setTactics({ width: v as Tactics["width"] })} t={t} color={ACCENTS[3]} />
            </div>
            {tags.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-1.5 border-t pt-3.5" style={{ borderColor: "var(--border-soft)" }}>
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{ color: "var(--muted-2)", background: "rgba(255,255,255,.05)" }}
                  >
                    {tl(tag)}
                  </span>
                ))}
              </div>
            )}
          </Tile>

          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "linear-gradient(160deg,#14241c,#131822)" }}>
            <div className="font-display mb-1.5 text-[15px] font-bold">{t("lineupValidity")}</div>
            <div className="mt-2.5 flex items-end gap-[7px]">
              <span className="font-display text-[40px] font-bold leading-none" style={{ color: validation.valid ? "var(--mint)" : "var(--red)" }}>
                {filled}/{required}
              </span>
            </div>
            <div className="mt-3">
              <StatBar value={filled} max={required} color={validation.valid ? "var(--mint)" : "var(--red)"} />
            </div>
            <div className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
              {validation.valid ? (
                <span style={{ color: "var(--mint)" }}>{t("lineupValid")}</span>
              ) : (
                <ul className="flex flex-col gap-1">
                  {validation.errors.map((e, i) => (
                    <li key={i} style={{ color: "var(--red)" }}>{e.ko}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* starting XI editor */}
      <Tile title={t("startingXI")}>
        <div className="grid gap-2 sm:grid-cols-2">
          {formation.slots.map((slot, i) => {
            const playerId = tactics.lineup[i];
            const p = playerId ? state.players[playerId] : undefined;
            const group = sport.positions.find((meta) => meta.key === slot.position)?.group ?? "";
            return (
              <div key={i} className="flex items-center gap-2.5 rounded-xl border px-3 py-2" style={{ borderColor: "var(--border-soft)", background: "var(--panel-2)" }}>
                <Avatar initials={slot.position} color={groupColor(group)} size={32} rounded="8px" />
                {p && <RatingNumber value={sport.calcOverall(p)} color={overallColor(sport.calcOverall(p))} size="text-sm" />}
                <select
                  value={playerId ?? ""}
                  onChange={(e) => setSlotPlayer(i, e.target.value)}
                  className="flex-1 rounded-md bg-transparent px-1 py-1 text-[12.5px] text-foreground outline-none"
                >
                  {playerId && !squadSorted.find((sp) => sp.id === playerId) && <option value={playerId}>{playerId}</option>}
                  {squadSorted.map((sp) => (
                    <option key={sp.id} value={sp.id} className="text-black">
                      {playerDisplayName(sp)} ({sport.calcOverall(sp)})
                    </option>
                  ))}
                </select>
                {p && (
                  <span className="shrink-0 text-[10.5px] font-semibold" style={{ color: conditionColor(p.condition) }}>
                    {Math.round(p.condition)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Tile>

      {/* bench */}
      <Tile title={t("bench")}>
        <div className="flex flex-wrap gap-2">
          {tactics.bench.length === 0 && <span style={{ color: "var(--muted-3)" }}>—</span>}
          {tactics.bench.map((id) => {
            const p = state.players[id];
            if (!p) return null;
            return (
              <span
                key={id}
                title={playerDisplayName(p)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px]"
                style={{ background: "rgba(255,255,255,.05)" }}
              >
                {shortName(p)}
                <span className="font-display text-xs font-bold" style={{ color: conditionColor(p.condition) }}>{Math.round(p.condition)}%</span>
              </span>
            );
          })}
        </div>
      </Tile>
    </div>
  );
}

const HOVER_ACCENTS = ["var(--mint)", "var(--blue)", "var(--gold)", "var(--purple)"];

function PlayerHoverCard({
  player,
  sport,
  t,
  tl,
}: {
  player: Player;
  sport: SportModule;
  t: ReturnType<typeof useI18n>["t"];
  tl: ReturnType<typeof useI18n>["tl"];
}) {
  const group = sport.positions.find((meta) => meta.key === player.positions[0])?.group ?? "";
  const ovr = sport.calcOverall(player);
  const groups = sport.attributeGroups.filter((g) => !g.onlyForGroup || g.onlyForGroup === group);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-sm font-bold text-foreground">{playerDisplayName(player)}</span>
        <RatingNumber value={ovr} color={overallColor(ovr)} size="text-sm" />
      </div>
      <div className="flex flex-col gap-2">
        {groups.map((g, i) => (
          <div key={g.key} className="flex flex-col gap-1">
            <div className="text-[9.5px] font-bold uppercase tracking-wide" style={{ color: HOVER_ACCENTS[i % HOVER_ACCENTS.length] }}>
              {tl(g.label)}
            </div>
            {g.attributes.map((attr) => {
              const value = player.attributes[attr.key] ?? 0;
              const color = attributeTierColor(value);
              return (
                <div key={attr.key} className="flex items-center gap-2 text-[11px]">
                  <span className="w-16 shrink-0" style={{ color: "var(--muted-2)" }}>{tl(attr.abbr)}</span>
                  <StatBar value={value} color={color} />
                  <span className="font-display w-6 shrink-0 text-right text-xs font-bold" style={{ color }}>{Math.round(value)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t pt-2 text-[10.5px]" style={{ borderColor: "var(--border-soft)", color: "var(--muted-2)" }}>
        <span>{t("condition")}</span>
        <span className="font-display font-bold" style={{ color: conditionColor(player.condition) }}>{Math.round(player.condition)}%</span>
      </div>
    </div>
  );
}

function InstrField({
  label,
  value,
  options,
  onChange,
  t,
  color,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  t: (k: never) => string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[12px]" style={{ color: "var(--muted-2)" }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-display rounded-md bg-transparent px-1 py-0.5 text-right text-[12.5px] font-bold outline-none"
        style={{ color }}
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
