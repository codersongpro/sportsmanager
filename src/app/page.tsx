"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useGameStore } from "@/lib/store/gameStore";
import { deleteSave, listSaves, loadGame, type SaveSummary } from "@/lib/store/persistence";
import { SPORT_ORDER, getSport } from "@/lib/sports";

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

  const mostRecent = saves?.[0];
  const olderSaves = saves?.slice(1) ?? [];

  return (
    <div
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 480px at 50% -8%, rgba(24,226,154,.16), transparent 60%), radial-gradient(700px 420px at 100% 100%, rgba(76,141,255,.10), transparent 60%)",
        }}
      />

      <div className="absolute right-6 top-6 z-10">
        <LocaleToggle />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div
          className="font-display flex h-[68px] w-[68px] items-center justify-center rounded-[18px] text-3xl font-bold"
          style={{
            background: "linear-gradient(135deg, var(--mint), #0a8f63)",
            color: "#06140e",
            boxShadow: "0 0 0 1px rgba(24,226,154,.3), 0 12px 32px rgba(24,226,154,.3)",
          }}
        >
          SM
        </div>
        <h1 className="font-display mt-3 text-5xl font-bold leading-none tracking-wide sm:text-6xl">
          {t("appTitle")}
        </h1>
        <p className="text-[15px]" style={{ color: "var(--muted-2)" }}>
          {t("tagline")}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {SPORT_ORDER.map((id) => {
            const sport = getSport(id);
            return (
              <span
                key={id}
                className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                style={{ borderColor: "var(--border-soft)", color: "var(--muted-2)", background: "var(--panel-2)" }}
              >
                {tl(sport.name)}
                {!sport.available && <span style={{ color: "var(--muted-3)" }}> · {t("comingSoon")}</span>}
              </span>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mt-10 flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/new-game"
          className="font-display flex items-center justify-center gap-2 rounded-[12px] px-5 py-3.5 text-center text-[15px] font-bold tracking-wide"
          style={{
            background: "linear-gradient(135deg, var(--mint), #0fae77)",
            color: "#06140e",
            boxShadow: "0 6px 18px rgba(24,226,154,.3)",
          }}
        >
          {t("newGame")}
        </Link>

        {mostRecent && (
          <button
            onClick={() => continueSave(mostRecent.id)}
            className="flex items-center justify-between gap-3 rounded-[12px] border px-4 py-3 text-left"
            style={{ borderColor: "var(--border-soft)", background: "var(--panel)" }}
          >
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--mint)" }}>
                {t("continueGame")}
              </div>
              <div className="mt-0.5 truncate text-[13.5px] font-semibold">
                {mostRecent.managerName} · {mostRecent.clubName}
              </div>
              <div className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-3)" }}>
                {tl(getSport(mostRecent.sportId).name)} · {t("season")} {mostRecent.season} · {t("day")} {mostRecent.day}
              </div>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--mint)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </button>
        )}

        {olderSaves.length > 0 && (
          <div className="mt-1 flex flex-col gap-1.5 rounded-[12px] border p-2.5" style={{ borderColor: "var(--border-soft)", background: "var(--panel-2)" }}>
            <span className="px-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>
              {t("loadGame")}
            </span>
            {olderSaves.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-[9px] px-2.5 py-2"
                style={{ background: "var(--panel)" }}
              >
                <button onClick={() => continueSave(s.id)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-[12.5px] font-semibold">
                    {s.managerName} — {s.clubName}
                  </div>
                  <div className="text-[10.5px]" style={{ color: "var(--muted-3)" }}>
                    {tl(getSport(s.sportId).name)} · {t("season")} {s.season} · {t("day")} {s.day}
                  </div>
                </button>
                <button onClick={() => removeSave(s.id)} className="shrink-0 text-[10.5px] font-semibold" style={{ color: "var(--red)" }}>
                  {t("deleteSave")}
                </button>
              </div>
            ))}
          </div>
        )}

        {saves && saves.length === 0 && (
          <p className="text-center text-[12.5px]" style={{ color: "var(--muted-3)" }}>
            {t("noSavedGame")}
          </p>
        )}
      </div>
    </div>
  );
}
