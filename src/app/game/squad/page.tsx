"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, RatingNumber, StatBar, conditionColor, groupColor, overallColor, ratingColorHex } from "@/components/Tile";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { playerDisplayName, playerInitials, formatMoney } from "@/lib/utils/format";

type SortKey = "num" | "name" | "position" | "age" | "overall" | "potential" | "condition" | "morale" | "rating" | "value";

function moraleColor(morale: number): string {
  if (morale >= 85) return "var(--mint)";
  if (morale >= 65) return "#7ee0bd";
  if (morale >= 40) return "var(--gold)";
  return "var(--red)";
}

const COLS = "46px 2.4fr 1fr .7fr .8fr .8fr 1.3fr 1.1fr .9fr 1fr";

export default function SquadPage() {
  const { t } = useI18n();
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [asc, setAsc] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  const sport = state ? getSport(state.sportId) : null;
  const groups = useMemo(() => (sport ? Array.from(new Set(sport.positions.map((p) => p.group))) : []), [sport]);

  const rows = useMemo(() => {
    if (!state || !sport) return [];
    const myClub = state.clubs[state.manager.clubId];
    let list = myClub.squad
      .map((id) => state.players[id])
      .filter(Boolean)
      .map((p) => {
        const rating = p.recentForm?.length ? p.recentForm[p.recentForm.length - 1].rating : null;
        const group = sport.positions.find((meta) => meta.key === p.positions[0])?.group ?? "";
        return { player: p, overall: sport.calcOverall(p), group, rating };
      });
    if (groupFilter) list = list.filter((r) => r.group === groupFilter);
    list.sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case "num":
          diff = (a.player.squadNumber ?? 999) - (b.player.squadNumber ?? 999);
          break;
        case "name":
          diff = playerDisplayName(a.player).localeCompare(playerDisplayName(b.player));
          break;
        case "position":
          diff = (a.player.positions[0] ?? "").localeCompare(b.player.positions[0] ?? "");
          break;
        case "age":
          diff = a.player.age - b.player.age;
          break;
        case "potential":
          diff = a.player.potential - b.player.potential;
          break;
        case "condition":
          diff = a.player.condition - b.player.condition;
          break;
        case "morale":
          diff = a.player.morale - b.player.morale;
          break;
        case "rating":
          diff = (a.rating ?? 0) - (b.rating ?? 0);
          break;
        case "value":
          diff = a.player.value - b.player.value;
          break;
        default:
          diff = a.overall - b.overall;
      }
      return asc ? diff : -diff;
    });
    return list;
  }, [state, sport, sortKey, asc, groupFilter]);

  if (!state || !sport) return null;

  const myClub = state.clubs[state.manager.clubId];
  const fullSquad = myClub.squad.map((id) => state.players[id]).filter(Boolean);
  const avgAge = fullSquad.length ? (fullSquad.reduce((sum, p) => sum + p.age, 0) / fullSquad.length).toFixed(1) : "-";
  const totalValue = fullSquad.reduce((sum, p) => sum + p.value, 0);

  function header(key: SortKey, label: string, align: "left" | "center" | "right" = "left") {
    return (
      <div
        onClick={() => {
          if (sortKey === key) setAsc(!asc);
          else {
            setSortKey(key);
            setAsc(false);
          }
        }}
        className={`cursor-pointer select-none ${align === "center" ? "text-center" : align === "right" ? "text-right" : ""}`}
      >
        {label}
        {sortKey === key ? (asc ? " ▲" : " ▼") : ""}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(255,255,255,.07)", background: "var(--panel)" }}>
      <div className="flex flex-wrap items-center gap-[14px] border-b px-5 py-4" style={{ borderColor: "rgba(255,255,255,.06)" }}>
        <div className="font-display text-base font-bold tracking-wide">{t("squad")}</div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setGroupFilter(null)}
            className="rounded-[7px] px-2.5 py-[3px] text-[11px] font-semibold"
            style={groupFilter === null ? { color: "#06140e", background: "var(--mint)" } : { color: "var(--muted-2)", background: "rgba(255,255,255,.05)" }}
          >
            {t("all")} {fullSquad.length}
          </button>
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className="rounded-[7px] px-2.5 py-[3px] text-[11px] font-semibold"
              style={groupFilter === g ? { color: "#06140e", background: "var(--mint)" } : { color: "var(--muted-2)", background: "rgba(255,255,255,.05)" }}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11.5px]" style={{ color: "var(--muted-2)" }}>
          {t("avgAge")} {avgAge} · {t("squadValue")} {formatMoney(totalValue)}
        </div>
      </div>

      <div
        className="grid gap-0 border-b px-5 py-[11px] text-[10.5px] font-semibold tracking-wide"
        style={{ gridTemplateColumns: COLS, color: "var(--muted-3)", borderColor: "rgba(255,255,255,.04)" }}
      >
        {header("num", "#")}
        {header("name", t("name"))}
        {header("position", t("position"))}
        {header("age", t("age"))}
        {header("overall", t("overall"), "center")}
        {header("potential", t("potential"), "center")}
        {header("condition", t("condition"))}
        {header("morale", t("morale"))}
        {header("rating", t("rating"), "center")}
        {header("value", t("value"), "right")}
      </div>

      <div>
        {rows.map(({ player, overall, group, rating }) => (
          <div
            key={player.id}
            onClick={() => router.push(`/game/squad/${player.id}`)}
            className="grid items-center gap-0 border-b px-5 py-[9px] cursor-pointer hover:bg-[color-mix(in_srgb,var(--mint)_5%,transparent)]"
            style={{ gridTemplateColumns: COLS, borderColor: "rgba(255,255,255,.035)" }}
          >
            <div className="font-display text-base font-bold" style={{ color: "var(--muted-3)" }}>{player.squadNumber ?? "-"}</div>
            <div className="flex items-center gap-[11px]">
              <Avatar initials={playerInitials(player)} color={groupColor(group)} size={34} rounded="9px" />
              <div>
                <div className="text-[13px] font-semibold">{playerDisplayName(player)}</div>
                <div className="mt-px text-[10px]" style={{ color: "var(--muted-3)" }}>{player.nationality}</div>
              </div>
            </div>
            <div><Badge color={groupColor(group)}>{player.positions[0]}</Badge></div>
            <div className="font-display-sm text-sm" style={{ color: "#9aa4b8" }}>{player.age}</div>
            <div className="text-center"><RatingNumber value={overall} color={overallColor(overall)} size="text-lg" /></div>
            <div className="text-center"><RatingNumber value={player.potential} color={overallColor(player.potential)} size="text-[15px]" /></div>
            <div className="flex items-center gap-2">
              <div className="max-w-[60px]"><StatBar value={player.condition} color={conditionColor(player.condition)} /></div>
              <span className="font-display-sm text-[11px]" style={{ color: conditionColor(player.condition) }}>{Math.round(player.condition)}%</span>
            </div>
            <div className="flex items-center gap-[7px]">
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: moraleColor(player.morale) }} />
              <span className="text-[11.5px]" style={{ color: "#b6bfcf" }}>{Math.round(player.morale)}</span>
            </div>
            <div className="text-center">
              <RatingNumber value={rating !== null ? rating.toFixed(2) : "-"} color={rating !== null ? ratingColorHex(rating) : "var(--muted-3)"} size="text-base" />
            </div>
            <div className="text-right font-display-sm text-xs" style={{ color: "#9aa4b8" }}>{formatMoney(player.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
