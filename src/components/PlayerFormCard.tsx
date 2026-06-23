"use client";

import type { Player } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Tile, ratingColor } from "./Tile";

const RESULT_COLOR: Record<string, string> = {
  W: "bg-emerald-500",
  D: "bg-amber-400",
  L: "bg-rose-500",
};

/** FM25-style "Last 5 Matches" form card: sparkline + per-match list. */
export function PlayerFormCard({ player }: { player: Player }) {
  const { t } = useI18n();
  const form = (player.recentForm ?? []).slice(-5);

  if (form.length === 0) {
    return (
      <Tile title={t("recentForm")}>
        <p className="text-sm text-zinc-400">{t("noForm")}</p>
      </Tile>
    );
  }

  const ratings = form.map((f) => f.rating);
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const W = form.filter((f) => f.result === "W").length;
  const D = form.filter((f) => f.result === "D").length;
  const L = form.filter((f) => f.result === "L").length;

  // sparkline (rating range ~4..10 mapped to a 100x36 box)
  const n = ratings.length;
  const pts = ratings.map((r, i) => {
    const x = n === 1 ? 50 : (i / (n - 1)) * 100;
    const y = 34 - ((Math.max(4, Math.min(10, r)) - 4) / 6) * 32;
    return { x, y, r };
  });
  const path = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <Tile title={t("recentForm")} action={<span className={`rounded px-1.5 text-xs font-bold ${ratingColor(avg)}`}>{avg.toFixed(2)}</span>}>
      <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="mb-3 h-16 w-full">
        <polyline points={path} fill="none" stroke="currentColor" strokeWidth="1.2" className="text-blue-500" vectorEffect="non-scaling-stroke" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.2" className={p.r >= 7.5 ? "fill-emerald-500" : p.r < 6 ? "fill-rose-500" : "fill-amber-500"} />
        ))}
      </svg>

      <div className="mb-2 flex items-center gap-3 text-xs text-zinc-500">
        <span>{t("avgRating")}: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{avg.toFixed(2)}</span></span>
        <span className="flex items-center gap-1">
          <b className="text-emerald-600">{W}</b>{t("won")} · <b className="text-amber-600">{D}</b>{t("drawn")} · <b className="text-rose-600">{L}</b>{t("lost")}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {[...form].reverse().map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${RESULT_COLOR[f.result]}`} />
            <span className="w-16 shrink-0 truncate text-zinc-500">{f.oppShort}</span>
            <span className="tabular-nums text-zinc-500">{f.scoreFor}-{f.scoreAgainst}</span>
            <span className={`ml-auto rounded px-1.5 text-xs font-bold tabular-nums ${ratingColor(f.rating)}`}>{f.rating.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </Tile>
  );
}
