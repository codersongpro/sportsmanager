"use client";

import { useState } from "react";
import type { Player, SportModule, Tactics } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { playerDisplayName, playerInitials } from "@/lib/utils/format";
import { shortName } from "@/components/MatchViewer";
import { RatingNumber, StatBar, attributeTierColor, conditionColor, groupColor, overallColor } from "@/components/Tile";
import { VenueSurfaceVertical, venueAspectVertical, venueBgStyle } from "@/components/Venue";

const HOVER_ACCENTS = ["var(--mint)", "var(--blue)", "var(--gold)", "var(--purple)"];

interface Props {
  sport: SportModule;
  tactics: Tactics;
  players: Record<string, Player>;
  maxHeight?: number;
  day?: number;
}

function isInjured(p: Player, day?: number): boolean {
  return p.injuredUntilDay != null && day != null && p.injuredUntilDay > day;
}

/** Vertical formation board (tactics-page style): per-sport surface with lineup slots and hover detail cards. Shared by the tactics page and the live Match Center. */
export function LineupBoard({ sport, tactics, players, maxHeight = 560, day }: Props) {
  const { t, tl } = useI18n();
  const [hovered, setHovered] = useState<number | null>(null);
  const pres = sport.matchPresentation;
  const formation = sport.formations.find((f) => f.key === tactics.formation) ?? sport.formations[0];

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-[14px] border"
      style={{ aspectRatio: venueAspectVertical(pres.venue), maxHeight, borderColor: "rgba(255,255,255,.08)", ...venueBgStyle(pres.venue) }}
    >
      <VenueSurfaceVertical venue={pres.venue} />
      {formation.slots.map((slot, i) => {
        const p = tactics.lineup[i] ? players[tactics.lineup[i]] : undefined;
        const group = sport.positions.find((meta) => meta.key === slot.position)?.group ?? "";
        const color = groupColor(group);
        const top = 100 - slot.y;
        const injured = p ? isInjured(p, day) : false;
        return (
          <div
            key={i}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: `${slot.x}%`, top: `${top}%`, zIndex: hovered === i ? 30 : 1 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
          >
            <div
              className="font-display relative flex h-10 w-10 cursor-default items-center justify-center rounded-full border-[2.5px] text-[15px] font-bold"
              style={{ background: "#0E121B", borderColor: injured ? "var(--red)" : color, color: "#EAEEF5", boxShadow: "0 4px 12px rgba(0,0,0,.4)" }}
            >
              {p ? playerInitials(p) : slot.position}
              {injured && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px]" style={{ background: "var(--red)" }}>
                  🩹
                </span>
              )}
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
                <PlayerHoverCard player={p} sport={sport} t={t} tl={tl} day={day} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlayerHoverCard({
  player,
  sport,
  t,
  tl,
  day,
}: {
  player: Player;
  sport: SportModule;
  t: ReturnType<typeof useI18n>["t"];
  tl: ReturnType<typeof useI18n>["tl"];
  day?: number;
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
      {isInjured(player, day) && (
        <div className="flex items-center justify-between text-[10.5px]" style={{ color: "var(--red)" }}>
          <span>🩹 {t("injured")}</span>
          <span className="font-display font-bold">D-{player.injuredUntilDay! - day!} {t("daysOut")}</span>
        </div>
      )}
    </div>
  );
}
