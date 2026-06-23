"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";

export default function TrainingPage() {
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);
  const setTrainingFocus = useGameStore((s) => s.setTrainingFocus);

  if (!state) return null;
  const sport = getSport(state.sportId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("training")}</h1>
      <p className="text-sm text-zinc-500">{t("teamFocus")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {sport.trainingFocuses.map((focus) => {
          const selected = state.trainingFocus === focus.key;
          return (
            <button
              key={focus.key}
              onClick={() => setTrainingFocus(focus.key)}
              className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left ${
                selected ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <span className="font-semibold">{tl(focus.label)}</span>
              <span className="text-xs text-zinc-500">{focus.attributes.join(", ")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
