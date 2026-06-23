"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { playerDisplayName, clubDisplayName, formatMoney } from "@/lib/utils/format";

export default function TransfersPage() {
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);
  const buyPlayer = useGameStore((s) => s.buyPlayer);
  const sellPlayer = useGameStore((s) => s.sellPlayer);
  const [query, setQuery] = useState("");
  const [freeAgentsOnly, setFreeAgentsOnly] = useState(false);

  const sport = state ? getSport(state.sportId) : null;
  const myClub = state ? state.clubs[state.manager.clubId] : null;

  const results = useMemo(() => {
    if (!state || !sport || !myClub) return [];
    const q = query.trim().toLowerCase();
    const list = Object.values(state.players).filter((p) => {
      if (p.clubId === myClub.id) return false;
      if (freeAgentsOnly && p.clubId !== null) return false;
      if (q && !p.name.toLowerCase().includes(q) && !(p.nameKo ?? "").includes(q)) return false;
      return true;
    });
    list.sort((a, b) => sport.calcOverall(b) - sport.calcOverall(a));
    return list.slice(0, 60);
  }, [state, sport, myClub, query, freeAgentsOnly]);

  if (!state || !sport || !myClub) return null;

  const mySquad = myClub.squad.map((id) => state.players[id]).filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("transferMarket")}</h1>
      <p className="text-sm text-zinc-500">
        {t("transferBudget")}: {formatMoney(myClub.finances.transferBudget)}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("name")}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={freeAgentsOnly} onChange={(e) => setFreeAgentsOnly(e.target.checked)} />
          {t("freeAgents")}
        </label>
      </div>

      <div className="flex flex-col gap-1">
        {results.map((p) => {
          const club = p.clubId ? state.clubs[p.clubId] : null;
          const affordable = myClub.finances.transferBudget >= p.value;
          return (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
              <div className="flex-1">
                <div className="font-medium">{playerDisplayName(p)}</div>
                <div className="text-xs text-zinc-500">
                  {p.positions[0]} · {t("age")} {p.age} · {t("overall")} {sport.calcOverall(p)} · {club ? clubDisplayName(club) : t("freeAgents")}
                </div>
              </div>
              <div className="text-right text-xs text-zinc-500">{formatMoney(p.value)}</div>
              <button
                disabled={!affordable}
                onClick={() => buyPlayer(p.id)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-white disabled:opacity-30"
              >
                {t("buy")}
              </button>
            </div>
          );
        })}
        {results.length === 0 && <p className="text-zinc-400">—</p>}
      </div>

      <h2 className="mt-4 font-semibold text-zinc-500">{t("myClub")}</h2>
      <div className="flex flex-col gap-1">
        {mySquad.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
            <div className="flex-1">
              <div className="font-medium">{playerDisplayName(p)}</div>
              <div className="text-xs text-zinc-500">
                {p.positions[0]} · {t("age")} {p.age} · {t("overall")} {sport.calcOverall(p)}
              </div>
            </div>
            <div className="text-right text-xs text-zinc-500">{formatMoney(p.value)}</div>
            <button onClick={() => sellPlayer(p.id)} className="rounded-md border px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              {t("sell")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
