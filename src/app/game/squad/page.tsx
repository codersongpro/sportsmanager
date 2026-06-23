"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { playerDisplayName, formatMoney } from "@/lib/utils/format";

type SortKey = "name" | "position" | "age" | "overall" | "value" | "wage";

function ovrColor(ovr: number): string {
  if (ovr >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (ovr >= 70) return "text-blue-600 dark:text-blue-400";
  if (ovr >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-zinc-500";
}

export default function SquadPage() {
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [asc, setAsc] = useState(false);

  const rows = useMemo(() => {
    if (!state) return [];
    const sport = getSport(state.sportId);
    const styleByKey = new Map(sport.playstyles.map((p) => [p.key, p]));
    const myClub = state.clubs[state.manager.clubId];
    const list = myClub.squad
      .map((id) => state.players[id])
      .filter(Boolean)
      .map((p) => ({
        player: p,
        overall: sport.calcOverall(p),
        styles: p.playstyles.map((k) => styleByKey.get(k)).filter((s): s is NonNullable<typeof s> => !!s),
      }));
    list.sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case "name":
          diff = a.player.name.localeCompare(b.player.name);
          break;
        case "position":
          diff = (a.player.positions[0] ?? "").localeCompare(b.player.positions[0] ?? "");
          break;
        case "age":
          diff = a.player.age - b.player.age;
          break;
        case "value":
          diff = a.player.value - b.player.value;
          break;
        case "wage":
          diff = a.player.wage - b.player.wage;
          break;
        default:
          diff = a.overall - b.overall;
      }
      return asc ? diff : -diff;
    });
    return list;
  }, [state, sortKey, asc]);

  if (!state) return null;

  function header(key: SortKey, label: string) {
    return (
      <th
        className="cursor-pointer py-1 pr-3 text-left hover:text-zinc-900 dark:hover:text-zinc-100"
        onClick={() => {
          if (sortKey === key) setAsc(!asc);
          else {
            setSortKey(key);
            setAsc(false);
          }
        }}
      >
        {label}
        {sortKey === key ? (asc ? " ▲" : " ▼") : ""}
      </th>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="mb-4 text-2xl font-bold">{t("squad")}</h1>
      <table className="w-full text-sm">
        <thead className="text-zinc-500">
          <tr className="border-b border-zinc-300 dark:border-zinc-700">
            {header("name", t("name"))}
            {header("position", t("position"))}
            {header("age", t("age"))}
            {header("overall", t("overall"))}
            <th className="py-1 pr-3 text-left">{t("potential")}</th>
            <th className="py-1 pr-3 text-left">{t("playstyles")}</th>
            {header("value", t("value"))}
            <th className="py-1 pr-3 text-left">{t("condition")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ player, overall, styles }) => (
            <tr key={player.id} className="border-b border-zinc-100 align-top dark:border-zinc-800">
              <td className="py-2 pr-3">
                <Link href={`/game/squad/${player.id}`} className="hover:underline">
                  {playerDisplayName(player)}
                </Link>
              </td>
              <td className="py-2 pr-3">{player.positions[0]}</td>
              <td className="py-2 pr-3 tabular-nums">{player.age}</td>
              <td className={`py-2 pr-3 text-base font-bold tabular-nums ${ovrColor(overall)}`}>{overall}</td>
              <td className="py-2 pr-3 tabular-nums text-zinc-500">{player.potential}</td>
              <td className="py-2 pr-3">
                <div className="flex flex-wrap gap-1">
                  {styles.length === 0 ? (
                    <span className="text-zinc-400">—</span>
                  ) : (
                    styles.map((s) => (
                      <span
                        key={s.key}
                        title={tl(s.desc)}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {tl(s.label)}
                      </span>
                    ))
                  )}
                </div>
              </td>
              <td className="py-2 pr-3 tabular-nums">{formatMoney(player.value)}</td>
              <td className="py-2 pr-3 tabular-nums">{Math.round(player.condition)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
