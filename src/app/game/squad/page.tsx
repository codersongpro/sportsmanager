"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { playerDisplayName, formatMoney } from "@/lib/utils/format";

type SortKey = "name" | "position" | "age" | "overall" | "value" | "wage";

export default function SquadPage() {
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [asc, setAsc] = useState(false);

  const rows = useMemo(() => {
    if (!state) return [];
    const sport = getSport(state.sportId);
    const myClub = state.clubs[state.manager.clubId];
    const list = myClub.squad
      .map((id) => state.players[id])
      .filter(Boolean)
      .map((p) => ({ player: p, overall: sport.calcOverall(p) }));
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
      </th>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="mb-4 text-2xl font-bold">{t("squad")}</h1>
      <table className="w-full text-sm">
        <thead className="text-zinc-500">
          <tr className="border-b border-zinc-300 dark:border-zinc-700">
            {header("name", t("name"))}
            {header("position", t("position"))}
            {header("age", t("age"))}
            {header("overall", t("overall"))}
            <th className="py-1 pr-3 text-left">{t("potential")}</th>
            {header("value", t("value"))}
            {header("wage", t("wage"))}
            <th className="py-1 pr-3 text-left">{t("condition")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ player, overall }) => (
            <tr key={player.id} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-1.5 pr-3">
                <Link href={`/game/squad/${player.id}`} className="hover:underline">
                  {playerDisplayName(player)}
                </Link>
              </td>
              <td className="py-1.5 pr-3">{player.positions[0]}</td>
              <td className="py-1.5 pr-3 tabular-nums">{player.age}</td>
              <td className="py-1.5 pr-3 font-semibold tabular-nums">{overall}</td>
              <td className="py-1.5 pr-3 tabular-nums text-zinc-500">{player.potential}</td>
              <td className="py-1.5 pr-3 tabular-nums">{formatMoney(player.value)}</td>
              <td className="py-1.5 pr-3 tabular-nums">{formatMoney(player.wage)}</td>
              <td className="py-1.5 pr-3 tabular-nums">{Math.round(player.condition)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
