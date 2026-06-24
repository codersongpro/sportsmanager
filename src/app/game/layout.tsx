"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useGameStore } from "@/lib/store/gameStore";
import { loadGame } from "@/lib/store/persistence";
import { getSport } from "@/lib/sports";
import { clubDisplayName } from "@/lib/utils/format";
import { StatusBadge } from "@/components/ui";

const NAV: { href: string; key: Parameters<ReturnType<typeof useI18n>["t"]>[0] }[] = [
  { href: "/game/dashboard", key: "dashboard" },
  { href: "/game/squad", key: "squad" },
  { href: "/game/tactics", key: "tactics" },
  { href: "/game/training", key: "training" },
  { href: "/game/finances", key: "finances" },
  { href: "/game/transfers", key: "transfers" },
  { href: "/game/competition", key: "competition" },
  { href: "/game/worldcup", key: "worldCup" },
  { href: "/game/press", key: "press" },
];

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { t, tl } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const state = useGameStore((s) => s.state);
  const loadFromSave = useGameStore((s) => s.loadFromSave);
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

  return (
    <div className={`flex min-h-screen flex-1 ${matchView ? "overflow-hidden" : ""}`}>
      <aside className="hidden w-64 shrink-0 border-r border-[var(--line)] bg-[var(--panel)] p-3 lg:flex lg:flex-col">
        <Link href="/game/dashboard" className="rounded-lg border border-[var(--line)] p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: myClub.primaryColor ?? "#1f6feb" }} />
            <span className="truncate font-bold">{clubDisplayName(myClub)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <StatusBadge tone="info">{tl(sport.name)}</StatusBadge>
            <StatusBadge>{t("season")} {state.season}</StatusBadge>
          </div>
        </Link>
        <nav className="mt-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname === item.href}>
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
          <Link href="/" className="rounded-md px-2 py-1.5 text-sm text-soft hover:bg-zinc-100 dark:hover:bg-zinc-900">
            {t("mainMenu")}
          </Link>
          <LocaleToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel)]/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{clubDisplayName(myClub)}</p>
            <p className="text-xs text-soft">{tl(sport.name)} · {t("day")} {state.day}</p>
          </div>
          <LocaleToggle />
        </header>

        {!matchView && (
          <div className="hidden border-b border-[var(--line)] bg-[var(--panel)]/80 px-5 py-3 lg:block">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-soft">{tl(sport.name)} Manager</p>
                <h1 className="text-lg font-bold">{clubDisplayName(myClub)}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-soft">
                <span>{t("season")} {state.season}</span>
                <span>·</span>
                <span>{t("day")} {state.day}</span>
              </div>
            </div>
          </div>
        )}

        <main className={`${matchView ? "h-screen overflow-hidden p-0" : "flex-1 px-4 pb-24 pt-5 lg:px-6 lg:pb-6"}`}>{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[var(--line)] bg-[var(--panel)]/95 p-1 backdrop-blur lg:hidden">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`rounded-md px-1 py-2 text-center text-[11px] font-semibold ${
                pathname === item.href ? "bg-blue-600 text-white" : "text-soft"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        {!matchView && (
          <div className="mx-4 mb-20 flex flex-wrap gap-1 lg:hidden">
            {secondaryNav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-soft">
                {t(item.key)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
      }`}
    >
      {children}
    </Link>
  );
}
