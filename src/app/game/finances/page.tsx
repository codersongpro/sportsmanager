"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { formatMoney } from "@/lib/utils/format";

export default function FinancesPage() {
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);

  if (!state) return null;
  const myClub = state.clubs[state.manager.clubId];
  const weeklyWages = myClub.squad.reduce((s, id) => s + (state.players[id]?.wage ?? 0), 0);
  const weeklyIncome = Math.round(myClub.reputation * 1800 + weeklyWages * 0.15);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("finances")}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={t("balance")} value={formatMoney(myClub.finances.balance)} />
        <Stat label={t("transferBudget")} value={formatMoney(myClub.finances.transferBudget)} />
        <Stat label={t("wageBudget")} value={formatMoney(myClub.finances.wageBudget)} />
      </div>
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-2 font-semibold text-zinc-500">{t("weeklyWages")}</h2>
        <div className="flex justify-between text-sm">
          <span>{t("income")}</span>
          <span className="font-medium text-emerald-600">+{formatMoney(weeklyIncome)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>{t("expenses")}</span>
          <span className="font-medium text-rose-600">-{formatMoney(weeklyWages)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-zinc-200 pt-1 text-sm font-semibold dark:border-zinc-800">
          <span>{t("balance")}</span>
          <span>{weeklyIncome - weeklyWages >= 0 ? "+" : ""}{formatMoney(weeklyIncome - weeklyWages)}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-800">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
