"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useGameStore } from "@/lib/store/gameStore";
import { deleteSave, listSaves, loadGame, type SaveSummary } from "@/lib/store/persistence";

export default function Home() {
  const { t, tl } = useI18n();
  const router = useRouter();
  const loadFromSave = useGameStore((s) => s.loadFromSave);
  const [saves, setSaves] = useState<SaveSummary[] | null>(null);

  useEffect(() => {
    listSaves().then(setSaves);
  }, []);

  async function continueSave(id: string) {
    const save = await loadGame(id);
    if (!save) return;
    loadFromSave(save);
    if (typeof window !== "undefined") localStorage.setItem("sm_last_save_id", id);
    router.push("/game/dashboard");
  }

  async function removeSave(id: string) {
    await deleteSave(id);
    setSaves((cur) => cur?.filter((s) => s.id !== id) ?? cur);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="absolute right-6 top-6">
        <LocaleToggle />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t("appTitle")}</h1>
        <p className="mt-2 text-zinc-500">{t("tagline")}</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/new-game"
          className="rounded-lg bg-blue-600 px-5 py-3 text-center font-semibold text-white hover:bg-blue-700"
        >
          {t("newGame")}
        </Link>

        {saves && saves.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <span className="text-sm font-medium text-zinc-500">{t("loadGame")}</span>
            {saves.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900">
                <button onClick={() => continueSave(s.id)} className="flex-1 text-left">
                  <div className="font-medium">{s.managerName} — {s.clubName}</div>
                  <div className="text-xs text-zinc-500">
                    {t("season")} {s.season} · {t("day")} {s.day}
                  </div>
                </button>
                <button onClick={() => removeSave(s.id)} className="text-xs text-rose-500 hover:underline">
                  {t("deleteSave")}
                </button>
              </div>
            ))}
          </div>
        )}

        {saves && saves.length === 0 && (
          <p className="text-center text-sm text-zinc-400">{t("noSavedGame")}</p>
        )}
      </div>
    </div>
  );
}
