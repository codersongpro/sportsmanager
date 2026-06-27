"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useGameStore } from "@/lib/store/gameStore";
import { loadGame, saveGame } from "@/lib/store/persistence";
import { getSport } from "@/lib/sports";
import { clubDisplayName, formatMoney } from "@/lib/utils/format";
import { Avatar } from "@/components/Tile";

const ICONS = {
  dash: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  squad: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  tactics: "M4 4h16v16H4zM4 9h16M9 4v16",
  training: "M6 6v12M18 6v12M4 9h2M4 15h2M18 9h2M18 15h2M6 12h12",
  finances: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  transfers: "M7 16l-4-4 4-4M3 12h13M17 8l4 4-4 4M21 12H8",
  competition: "M5 21V10M12 21V4M19 21V14",
  worldCup: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c2.7 2.6 4 5.8 4 10s-1.3 7.4-4 10c-2.7-2.6-4-5.8-4-10s1.3-7.4 4-10z",
  press: "M3 11l18-6v14L3 15v-4zM7 15v3a2 2 0 002 2h1v-5",
};

const NAV: { href: string; key: Parameters<ReturnType<typeof useI18n>["t"]>[0]; icon: string }[] = [
  { href: "/game/dashboard", key: "dashboard", icon: ICONS.dash },
  { href: "/game/squad", key: "squad", icon: ICONS.squad },
  { href: "/game/tactics", key: "tactics", icon: ICONS.tactics },
  { href: "/game/training", key: "training", icon: ICONS.training },
  { href: "/game/finances", key: "finances", icon: ICONS.finances },
  { href: "/game/transfers", key: "transfers", icon: ICONS.transfers },
  { href: "/game/competition", key: "competition", icon: ICONS.competition },
  { href: "/game/worldcup", key: "worldCup", icon: ICONS.worldCup },
  { href: "/game/press", key: "press", icon: ICONS.press },
];

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { t, tl } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const state = useGameStore((s) => s.state);
  const loadFromSave = useGameStore((s) => s.loadFromSave);
  const continueGame = useGameStore((s) => s.continue);
  const rollover = useGameStore((s) => s.rolloverSeason);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (state) return;
    const id = typeof window !== "undefined" ? localStorage.getItem("sm_last_save_id") : null;
    if (!id) {
      router.replace("/");
      return;
    }
    loadGame(id).then((save) => {
      if (save) loadFromSave(save);
      else router.replace("/");
      setChecked(true);
    });
  }, [state, router, loadFromSave]);

  if ((!checked && !state) || !state) return null;
  const myClub = state.clubs[state.manager.clubId];
  const sport = getSport(state.sportId);
  const matchView = pathname.startsWith("/game/match/");
  const navItems = state.sportId === "soccer" ? NAV : NAV.filter((item) => item.href !== "/game/worldcup");
  const primaryNav = navItems.slice(0, 4);
  const secondaryNav = navItems.slice(4);
  const activeItem = navItems.find((item) => pathname === item.href);

  function handleContinue() {
    continueGame();
    const updated = useGameStore.getState().state;
    if (updated?.activeMatch && !updated.activeMatch.finished) {
      router.push("/game/match/live");
    } else if (updated?.lastResultFixtureId) {
      router.push(`/game/match/${updated.lastResultFixtureId}`);
    }
  }

  async function handleSaveAndExit() {
    const cur = useGameStore.getState().state;
    if (cur) await saveGame(cur);
    router.push("/");
  }

  return (
    <div className={`flex min-h-screen flex-1 ${matchView ? "overflow-hidden" : ""}`} style={{ background: "var(--bg-base)" }}>
      <aside
        className="hidden shrink-0 flex-col gap-1 p-3.5 lg:flex"
        style={{ width: 236, background: "var(--bg-sidebar)", borderRight: "1px solid var(--border-soft)" }}
      >
        <div className="flex items-center gap-2.5 px-1.5 pb-4 pt-1">
          <div
            className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-xl font-bold"
            style={{
              background: "linear-gradient(135deg, var(--mint), #0a8f63)",
              color: "#06140e",
              boxShadow: "0 0 0 1px rgba(24,226,154,.3), 0 6px 16px rgba(24,226,154,.25)",
            }}
          >
            SM
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display truncate text-[17px] font-bold leading-none tracking-wide">PRO MANAGER</div>
            <div className="mt-1 text-[10px] tracking-[2px]" style={{ color: "var(--muted-3)" }}>
              {t("season").toUpperCase()} {state.season}
            </div>
          </div>
          <button
            onClick={handleSaveAndExit}
            title={t("saveAndExit")}
            aria-label={t("saveAndExit")}
            className="shrink-0 rounded-[9px] p-2"
            style={{ color: "var(--muted-2)", background: "rgba(255,255,255,.04)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>

        <nav className="mt-1 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[13.5px] transition-colors"
                style={{
                  fontWeight: active ? 700 : 500,
                  background: active ? "rgba(24,226,154,.12)" : "transparent",
                  color: active ? "var(--mint)" : "#9aa4b8",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/game/dashboard"
          className="mt-auto flex items-center gap-2.5 rounded-xl border p-3"
          style={{ background: "var(--panel)", borderColor: "var(--border-soft)" }}
        >
          <Avatar initials={myClub.shortName?.slice(0, 2).toUpperCase() ?? "??"} color={myClub.primaryColor ?? "var(--blue)"} size={34} />
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold">{clubDisplayName(myClub)}</div>
            <div className="truncate text-[10.5px]" style={{ color: "var(--muted-2)" }}>
              {tl(sport.name)} · {state.manager.name}
            </div>
          </div>
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur lg:hidden"
          style={{ background: "color-mix(in srgb, var(--bg-topbar) 95%, transparent)", borderColor: "var(--border-soft)" }}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{clubDisplayName(myClub)}</p>
            <p className="text-xs" style={{ color: "var(--muted-2)" }}>
              {tl(sport.name)} · {t("day")} {state.day}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={handleSaveAndExit}
              title={t("saveAndExit")}
              aria-label={t("saveAndExit")}
              className="rounded-[9px] p-2"
              style={{ color: "var(--muted-2)", background: "rgba(255,255,255,.04)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
            <LocaleToggle />
          </div>
        </header>

        {!matchView && (
          <header
            className="hidden items-center gap-4 border-b px-5.5 lg:flex"
            style={{ height: 60, background: "var(--bg-topbar)", borderColor: "var(--border-soft)" }}
          >
            <div className="flex flex-col">
              <div className="font-display text-[18px] font-bold leading-none tracking-wide">
                {activeItem ? t(activeItem.key) : tl(sport.name)}
              </div>
              <div className="mt-0.5 text-[11px]" style={{ color: "var(--muted-3)" }}>
                {t("season")} {state.season} · {t("day")} {state.day}
              </div>
            </div>

            <div
              className="ml-2 flex items-center gap-1.5 rounded-[10px] border px-1.5 py-1"
              style={{ background: "var(--panel)", borderColor: "var(--border-soft)" }}
            >
              <span className="px-1.5 text-[11px] font-semibold" style={{ color: "var(--mint)" }}>
                {tl(sport.name)}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] tracking-wide" style={{ color: "var(--muted-3)" }}>
                  {t("transferBudget").toUpperCase()}
                </div>
                <div className="font-display text-[17px] font-bold leading-none" style={{ color: "var(--mint)" }}>
                  ₩{formatMoney(myClub.finances.transferBudget)}
                </div>
              </div>
              <div className="h-7 w-px" style={{ background: "var(--border-soft)" }} />
              <div className="text-right">
                <div className="text-[10px] tracking-wide" style={{ color: "var(--muted-3)" }}>
                  {t("season").toUpperCase()} · {t("day").toUpperCase()}
                </div>
                <div className="font-display mt-0.5 text-[15px] font-semibold leading-none">
                  {state.season} · {state.day}
                </div>
              </div>
              {!state.seasonOver ? (
                <button
                  onClick={handleContinue}
                  className="flex items-center gap-2 rounded-[10px] px-4.5 py-2.5 text-[13.5px] font-bold"
                  style={{
                    background: "linear-gradient(135deg, var(--mint), #0fae77)",
                    color: "#06140e",
                    boxShadow: "0 4px 14px rgba(24,226,154,.3)",
                  }}
                >
                  {t("continueBtn")}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#06140e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => rollover()}
                  className="flex items-center gap-2 rounded-[10px] px-4.5 py-2.5 text-[13.5px] font-bold"
                  style={{ background: "linear-gradient(135deg, var(--mint), #0fae77)", color: "#06140e" }}
                >
                  {t("startNewSeason")}
                </button>
              )}
              <LocaleToggle />
            </div>
          </header>
        )}

        <main
          className={
            matchView
              ? "flex-1 overflow-y-auto p-0 pb-20 lg:h-screen lg:overflow-hidden lg:pb-0"
              : "flex-1 overflow-y-auto px-4 pb-24 pt-5 lg:px-6 lg:pb-6"
          }
          style={
            matchView
              ? undefined
              : { background: "radial-gradient(1200px 500px at 80% -10%, rgba(24,226,154,.05), transparent 60%), var(--bg-base)" }
          }
        >
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t p-1 backdrop-blur lg:hidden"
          style={{ background: "color-mix(in srgb, var(--bg-topbar) 95%, transparent)", borderColor: "var(--border-soft)" }}
        >
          {primaryNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="rounded-md px-1 py-2 text-center text-[11px] font-semibold"
                style={{ background: active ? "rgba(24,226,154,.12)" : "transparent", color: active ? "var(--mint)" : "var(--muted-2)" }}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {!matchView && (
          <div className="mx-4 mb-20 flex flex-wrap gap-1 lg:hidden">
            {secondaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border px-3 py-1 text-xs"
                style={{ borderColor: "var(--border-soft)", color: "var(--muted-2)" }}
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
