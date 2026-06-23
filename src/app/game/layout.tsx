"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useGameStore } from "@/lib/store/gameStore";
import { loadGame } from "@/lib/store/persistence";

const NAV: { href: string; key: Parameters<ReturnType<typeof useI18n>["t"]>[0] }[] = [
  { href: "/game/dashboard", key: "dashboard" },
  { href: "/game/squad", key: "squad" },
  { href: "/game/tactics", key: "tactics" },
  { href: "/game/training", key: "training" },
  { href: "/game/finances", key: "finances" },
  { href: "/game/transfers", key: "transfers" },
  { href: "/game/competition", key: "competition" },
  { href: "/game/worldcup", key: "worldCup" },
];

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const state = useGameStore((s) => s.state);
  const loadFromSave = useGameStore((s) => s.loadFromSave);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (state) {
      setChecked(true);
      return;
    }
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

  if (!checked || !state) return null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <nav className="flex flex-wrap gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm ${
                pathname === item.href
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-zinc-500 hover:underline">
            {t("mainMenu")}
          </Link>
          <LocaleToggle />
        </div>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
