"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { Tile } from "@/components/Tile";

export default function PressPage() {
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);
  const answerPress = useGameStore((s) => s.answerPress);

  if (!state) return null;
  const press = state.press ?? [];
  const pending = press.filter((p) => !p.answered);
  const answered = [...press].filter((p) => p.answered).reverse();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("pressConference")}</h1>

      {pending.length === 0 && <p className="text-sm text-zinc-400">{t("noPress")}</p>}

      {pending.map((item) => (
        <Tile key={item.id} title={`${t("day")} ${item.day}`}>
          <p className="mb-3 font-medium">“{tl(item.question)}”</p>
          <div className="flex flex-col gap-2">
            {item.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answerPress(item.id, i)}
                className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 text-left text-sm hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-800 dark:hover:bg-blue-950/30"
              >
                <span>{tl(opt.text)}</span>
                <span className="flex shrink-0 gap-2 text-xs">
                  <span className={opt.moraleDelta >= 0 ? "text-emerald-600" : "text-rose-500"}>
                    {t("morale")} {opt.moraleDelta >= 0 ? "+" : ""}{opt.moraleDelta}
                  </span>
                  <span className={opt.repDelta >= 0 ? "text-emerald-600" : "text-rose-500"}>
                    {t("managerReputation")} {opt.repDelta >= 0 ? "+" : ""}{opt.repDelta}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Tile>
      ))}

      {answered.length > 0 && (
        <div className="mt-2">
          <h2 className="mb-2 font-semibold text-zinc-500">{t("news")}</h2>
          <div className="flex flex-col gap-2">
            {answered.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-md border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800">
                <p className="text-zinc-500">“{tl(item.question)}”</p>
                {item.chosen != null && <p className="mt-0.5 font-medium">→ {tl(item.options[item.chosen].reply)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
